import { taskRepository } from "./task.repository";
import { listRepository } from "../list/list.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { ITask, TaskModel } from "./task.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { notificationService } from "../notification/notification.service";
import mongoose from "mongoose";
import { activityService } from "../activity/activity.service";
import { broadcastToWorkspace } from "../../utils/socket";

export class TaskService {
  async createTask(taskData: Partial<ITask> & { listId: string }, userId: string): Promise<ITask> {
    const list = await listRepository.findById(taskData.listId);
    if (!list) {
      throw new NotFoundError("List not found");
    }

    // Verify workspace membership
    // Yes:
    const space = await mongoose.model("Space").findById(list.spaceId);
    if (!space) {
      throw new NotFoundError("Associated Space not found");
    }

    const wsMembership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!wsMembership || wsMembership.status !== "active") {
      throw new ForbiddenError("You are not authorized to create tasks in this workspace");
    }

    // Set defaults
    const status = taskData.status || "to-do";
    const completeTaskData = {
      ...taskData,
      workspaceId: space.workspaceId,
      spaceId: space._id,
      reporterId: new mongoose.Types.ObjectId(userId),
      assignees: taskData.assignees?.map((id) => new mongoose.Types.ObjectId(id.toString())) || [],
      clientProjectId: taskData.clientProjectId ? new mongoose.Types.ObjectId(taskData.clientProjectId.toString()) : undefined,
      projectName: taskData.projectName || "",
      notes: taskData.notes || "",
      status,
      statusHistory: [{
        status,
        enteredAt: new Date(),
      }],
    };

    const newTask = await taskRepository.createTask(completeTaskData);

    // Trigger Notifications for assignees
    if (newTask.assignees && newTask.assignees.length > 0) {
      const assigneesToNotify = newTask.assignees.map((a: any) => a._id?.toString() || a.toString());
      for (const assigneeId of assigneesToNotify) {
        if (assigneeId !== userId) {
          await notificationService.createNotification(
              assigneeId,
              "New Task Assigned",
              `You have been assigned to task: "${newTask.title}"`,
              "task_assigned",
              userId,
              newTask._id.toString(),
              "task"
          );
        }
      }
    }

    // Record Activity
    await activityService.logActivity({
      workspaceId: space.workspaceId,
      userId: userId,
      entityType: "task",
      entityId: newTask._id,
      action: "created",
      details: {
        title: newTask.title,
        changes: {
          title: { new: newTask.title },
          status: { new: newTask.status },
          priority: { new: newTask.priority },
          dueDate: { new: newTask.dueDate },
        }
      },
    });

    // Broadcast WebSocket event
    broadcastToWorkspace(space.workspaceId.toString(), "task-created", newTask);

    return newTask;
  }

  async getTasksByList(listId: string, userId: string): Promise<ITask[]> {
    const list = await listRepository.findById(listId);
    if (!list) {
      throw new NotFoundError("List not found");
    }

    const space = await mongoose.model("Space").findById(list.spaceId);
    if (!space) {
      throw new NotFoundError("Associated Space not found");
    }

    // Verify workspace membership
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    // Employees (members/guests) should only see their own assigned tasks or tasks they reported
    if (membership.role === "member" || membership.role === "guest") {
      return TaskModel.find({
        listId: new mongoose.Types.ObjectId(listId),
        deleted: { $ne: true },
        $or: [
          { reporterId: new mongoose.Types.ObjectId(userId) },
          { assignees: new mongoose.Types.ObjectId(userId) },
        ],
      })
        .sort({ position: 1 })
        .populate("assignees", "fullName email avatarUrl")
        .exec();
    }

    return taskRepository.findByList(listId);
  }

  async updateTask(taskId: string, updateData: Record<string, any>, userId: string): Promise<ITask> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Verify membership permissions
    const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have permission to modify tasks in this workspace");
    }

    // Map assignees if provided
    const oldAssignees = task.assignees.map((id) => id.toString());
    const oldStatus = task.status;
    const oldListId = task.listId.toString();

    if (updateData.assignees) {
      updateData.assignees = updateData.assignees.map((id: any) => new mongoose.Types.ObjectId(id.toString()));
    }

    if (updateData.workspaceId) {
      updateData.workspaceId = new mongoose.Types.ObjectId(updateData.workspaceId);
    }
    if (updateData.spaceId) {
      updateData.spaceId = new mongoose.Types.ObjectId(updateData.spaceId);
    }
    if (updateData.listId) {
      updateData.listId = new mongoose.Types.ObjectId(updateData.listId);
    }
    if (updateData.clientProjectId) {
      updateData.clientProjectId = new mongoose.Types.ObjectId(updateData.clientProjectId);
    }

    // Status timing tracking
    const statusChanged = updateData.status && updateData.status !== oldStatus;
    if (statusChanged) {
      const now = new Date();
      const statusHistory = [...(task.statusHistory || [])];
      
      // Close active history entry
      if (statusHistory.length > 0) {
        const lastEntry = statusHistory[statusHistory.length - 1];
        if (!lastEntry.leftAt) {
          lastEntry.leftAt = now;
          lastEntry.durationMs = now.getTime() - new Date(lastEntry.enteredAt).getTime();
        }
      }

      // Add new entry
      statusHistory.push({
        status: updateData.status,
        enteredAt: now,
      });
      updateData.statusHistory = statusHistory;

      // Recalculate totals
      let queueSum = 0;
      let progressSum = 0;
      let reviewSum = 0;

      statusHistory.forEach((h) => {
        const dur = h.durationMs || (h.leftAt ? (new Date(h.leftAt).getTime() - new Date(h.enteredAt).getTime()) : (now.getTime() - new Date(h.enteredAt).getTime()));
        if (h.status === "to-do") {
          queueSum += dur;
        } else if (h.status === "in-progress") {
          progressSum += dur;
        } else if (h.status === "review" || h.status === "revision-requested") {
          reviewSum += dur;
        }
      });

      updateData.timeInQueueMs = queueSum;
      updateData.timeInProgressMs = progressSum;
      updateData.timeInReviewMs = reviewSum;

      if (updateData.status === "in-progress" && !task.startDate) {
        updateData.startDate = now;
      }

      if (updateData.status === "done") {
        updateData.completedAt = now;
        const firstEntry = statusHistory[0];
        if (firstEntry) {
          updateData.totalCycleTimeMs = now.getTime() - new Date(firstEntry.enteredAt).getTime();
        }
      } else if (oldStatus === "done") {
        updateData.completedAt = null;
      }
    }

    const changes: Record<string, { old: any; new: any }> = {};
    const trackFields = ["title", "description", "status", "priority", "dueDate", "projectName", "notes", "delayReason", "cancellationReason", "blockedReason", "rejectedReason", "revisionReason"];
    trackFields.forEach((field) => {
      if (updateData[field] !== undefined && String(updateData[field]) !== String((task as any)[field] || "")) {
        changes[field] = {
          old: (task as any)[field] || "",
          new: updateData[field],
        };
      }
    });

    if (updateData.assignees) {
      const newAssigneeStrings = updateData.assignees.map((id: any) => id.toString());
      if (JSON.stringify(oldAssignees.sort()) !== JSON.stringify(newAssigneeStrings.sort())) {
        changes.assignees = {
          old: oldAssignees,
          new: newAssigneeStrings,
        };
      }
    }

    const updatedTask = await taskRepository.updateTask(taskId, updateData);
    if (!updatedTask) {
      throw new NotFoundError("Task could not be updated");
    }

    // Trigger notification if newly assigned
    if (updateData.assignees) {
      const newAssigneeStrings = updateData.assignees.map((id: any) => id.toString());
      for (const newAssignee of newAssigneeStrings) {
        if (!oldAssignees.includes(newAssignee) && newAssignee !== userId) {
          await notificationService.createNotification(
            newAssignee,
            "New Task Assigned",
            `You have been assigned to task: "${updatedTask.title}"`,
            "task_assigned",
            userId,
            updatedTask._id.toString(),
            "task"
          );
        }
      }
    }

    // Trigger notification if status/list changed
    const listChanged = updateData.listId && updateData.listId.toString() !== oldListId;

    if (statusChanged || listChanged) {
      const assigneesToNotify = updatedTask.assignees.map((a: any) => a._id?.toString() || a.toString());
      for (const assigneeId of assigneesToNotify) {
        if (assigneeId !== userId) {
          await notificationService.createNotification(
            assigneeId,
            "Task Updated",
            `Task "${updatedTask.title}" status has changed to "${updatedTask.status}"`,
            "task_updated",
            userId,
            updatedTask._id.toString(),
            "task"
          );
        }
      }
    }

    // Determine action and detail updates
    const isMoved = updateData.listId && updateData.listId.toString() !== oldListId;
    const action = isMoved ? "moved" : "updated";

    // Record Activity
    await activityService.logActivity({
      workspaceId: task.workspaceId,
      userId: userId,
      entityType: "task",
      entityId: task._id,
      action: action,
      details: {
        title: updatedTask.title,
        changes,
      },
    });

    // Broadcast WebSocket event
    broadcastToWorkspace(task.workspaceId.toString(), "task-updated", updatedTask);

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Only workspace managers, admins or owners can delete tasks");
    }

    // Soft delete
    await taskRepository.deleteTask(taskId, userId);

    // Record Activity
    await activityService.logActivity({
      workspaceId: task.workspaceId,
      userId: userId,
      entityType: "task",
      entityId: task._id,
      action: "deleted",
      details: { title: task.title },
    });

    // Broadcast WebSocket event
    broadcastToWorkspace(task.workspaceId.toString(), "task-deleted", { taskId });
  }

  async getTasksByWorkspace(workspaceId: string, userId: string): Promise<ITask[]> {
    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this workspace");
    }

    // Employees (members/guests) should only see their own assigned tasks or tasks they reported
    if (membership.role === "member" || membership.role === "guest") {
      return taskRepository.findTasks({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        $or: [
          { reporterId: new mongoose.Types.ObjectId(userId) },
          { assignees: new mongoose.Types.ObjectId(userId) },
        ],
      });
    }

    return taskRepository.findTasks({ workspaceId: new mongoose.Types.ObjectId(workspaceId) });
  }

  async getTaskById(taskId: string, userId: string): Promise<ITask> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this task");
    }

    return task;
  }

  async requestRevision(
    taskId: string,
    revisionData: { notes: string; assigneeId?: string; listId?: string },
    userId: string
  ): Promise<ITask> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Only workspace managers, admins or owners can request revisions");
    }

    const updateData: Record<string, any> = {
      $set: {
        needsRevision: true,
      },
      $push: {
        revisionNotes: {
          notes: revisionData.notes,
          requestedBy: new mongoose.Types.ObjectId(userId),
          createdAt: new Date(),
        },
      },
    };

    if (revisionData.assigneeId) {
      updateData.$set.assignees = [new mongoose.Types.ObjectId(revisionData.assigneeId)];
    }

    if (revisionData.listId) {
      updateData.$set.listId = new mongoose.Types.ObjectId(revisionData.listId);
      const list = await listRepository.findById(revisionData.listId);
      if (list) {
        updateData.$set.status = list.name.toLowerCase().replace(/\s+/g, "-");
      }
    }

    const updatedTask = await taskRepository.updateTask(taskId, updateData);
    if (!updatedTask) {
      throw new NotFoundError("Task could not be updated");
    }

    // Notify assignee
    const assigneesToNotify = updatedTask.assignees.map((a: any) => a._id?.toString() || a.toString());
    for (const assigneeId of assigneesToNotify) {
      await notificationService.createNotification(
        assigneeId,
        "Client Revision Requested",
        `A revision was requested for task: "${updatedTask.title}". Reason: ${revisionData.notes}`,
        "task_updated",
        userId,
        updatedTask._id.toString(),
        "task"
      );
    }

    // Record Activity
    await activityService.logActivity({
      workspaceId: task.workspaceId,
      userId: userId,
      entityType: "task",
      entityId: task._id,
      action: "updated",
      details: {
        title: updatedTask.title,
        changes: { needsRevision: true, notes: revisionData.notes },
      },
    });

    // Broadcast WebSocket event
    broadcastToWorkspace(task.workspaceId.toString(), "task-updated", updatedTask);

    return updatedTask;
  }
}

export const taskService = new TaskService();
