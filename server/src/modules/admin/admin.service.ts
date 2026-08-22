import { TaskModel } from "../task/task.model";
import { UserModel } from "../user/user.model";
import { WorkspaceModel } from "../workspace/workspace.model";
import { ClientProjectModel } from "../clientProject/clientProject.model";
import { MembershipModel } from "../workspace/membership.model";
import { SpaceModel } from "../space/space.model";
import { NotFoundError } from "../../utils/errors";

export class AdminService {
  /**
   * Retrieves global counters for the admin dashboard.
   */
  async getGlobalStats(): Promise<any> {
    const totalCompanies = await WorkspaceModel.countDocuments();
    const totalEmployees = await UserModel.countDocuments();
    const activeTasks = await TaskModel.countDocuments({
      status: { $ne: "done" },
      deleted: { $ne: true }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const completedToday = await TaskModel.countDocuments({
      status: "done",
      deleted: { $ne: true },
      updatedAt: { $gte: startOfToday }
    });

    const now = new Date();
    const delayedTasks = await TaskModel.countDocuments({
      status: { $ne: "done" },
      deleted: { $ne: true },
      dueDate: { $lt: now }
    });

    return {
      totalCompanies,
      totalEmployees,
      activeTasks,
      completedToday,
      delayedTasks
    };
  }

  /**
   * Calculates performance metrics per employee.
   */
  async getEmployeePerformance(): Promise<any[]> {
    const users = await UserModel.find({}, "fullName email avatarUrl");
    const performanceList: any[] = [];

    const now = new Date();

    for (const u of users) {
      const assignedTasksCount = await TaskModel.countDocuments({
        assignees: u._id,
        deleted: { $ne: true }
      });

      const completedCount = await TaskModel.countDocuments({
        assignees: u._id,
        status: "done",
        deleted: { $ne: true }
      });

      const inProgressCount = await TaskModel.countDocuments({
        assignees: u._id,
        status: "in-progress",
        deleted: { $ne: true }
      });

      const delayedCount = await TaskModel.countDocuments({
        assignees: u._id,
        status: { $ne: "done" },
        dueDate: { $lt: now },
        deleted: { $ne: true }
      });

      const cancelledCount = await TaskModel.countDocuments({
        assignees: u._id,
        status: "cancelled",
        deleted: { $ne: true }
      });

      // Calculate averages from status history
      const tasksWithHistory = await TaskModel.find({
        assignees: u._id,
        deleted: { $ne: true }
      });

      let totalCompletionTimeMs = 0;
      let completedTasksWithHistory = 0;

      let totalReviewTimeMs = 0;
      let reviewTasksWithHistory = 0;

      for (const task of tasksWithHistory) {
        let progressDur = task.timeInProgressMs || 0;
        let reviewDur = task.timeInReviewMs || 0;

        if (task.status === "done") {
          totalCompletionTimeMs += progressDur;
          completedTasksWithHistory++;
        }

        if (reviewDur > 0) {
          totalReviewTimeMs += reviewDur;
          reviewTasksWithHistory++;
        }
      }

      const avgCompletionHours = completedTasksWithHistory > 0
        ? Number((totalCompletionTimeMs / (1000 * 60 * 60) / completedTasksWithHistory).toFixed(1))
        : 0;

      const avgReviewHours = reviewTasksWithHistory > 0
        ? Number((totalReviewTimeMs / (1000 * 60 * 60) / reviewTasksWithHistory).toFixed(1))
        : 0;

      performanceList.push({
        userId: u._id,
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        assignedTasks: assignedTasksCount,
        completed: completedCount,
        inProgress: inProgressCount,
        delayed: delayedCount,
        cancelled: cancelledCount,
        avgCompletionHours,
        avgReviewHours
      });
    }

    return performanceList;
  }

  /**
   * Retrieves soft-deleted tasks.
   */
  async getDeletedTasks(): Promise<any[]> {
    return TaskModel.find({ deleted: true })
      .populate("deletedBy", "fullName email avatarUrl")
      .populate("workspaceId", "name slug")
      .populate("clientProjectId", "clientName")
      .sort({ deletedAt: -1 })
      .exec();
  }

  /**
   * Restores a soft-deleted task.
   */
  async restoreTask(taskId: string): Promise<any> {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    task.deleted = false;
    task.deletedAt = undefined;
    task.deletedBy = undefined;

    await task.save();
    return task;
  }

  /**
   * Retrieves all companies (workspaces) with breakdown analytics.
   */
  async getCompaniesAnalytics(): Promise<any[]> {
    const workspaces = await WorkspaceModel.find().populate("ownerId", "fullName email");
    const result: any[] = [];

    const now = new Date();

    for (const ws of workspaces) {
      const clients = await ClientProjectModel.find({ workspaceId: ws._id });
      const spaces = await SpaceModel.find({ workspaceId: ws._id });
      const members = await MembershipModel.find({ workspaceId: ws._id }).populate("userId", "fullName email avatarUrl");

      const totalTasks = await TaskModel.countDocuments({ workspaceId: ws._id, deleted: { $ne: true } });
      const activeTasks = await TaskModel.countDocuments({ workspaceId: ws._id, status: { $ne: "done" }, deleted: { $ne: true } });
      const delayedTasks = await TaskModel.countDocuments({ workspaceId: ws._id, status: { $ne: "done" }, dueDate: { $lt: now }, deleted: { $ne: true } });

      result.push({
        _id: ws._id,
        name: ws.name,
        slug: ws.slug,
        logoUrl: ws.logoUrl,
        createdAt: ws.createdAt,
        owner: ws.ownerId,
        clients,
        spaces,
        members,
        stats: {
          totalTasks,
          activeTasks,
          delayedTasks
        }
      });
    }

    return result;
  }
}

export const adminService = new AdminService();
