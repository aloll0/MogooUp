import { taskRepository } from "./task.repository";
import { listRepository } from "../list/list.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { ITask } from "./task.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import mongoose from "mongoose";

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
    const completeTaskData = {
      ...taskData,
      workspaceId: space.workspaceId,
      spaceId: space._id,
      reporterId: new mongoose.Types.ObjectId(userId),
      assignees: taskData.assignees?.map((id) => new mongoose.Types.ObjectId(id.toString())) || [],
    };

    return taskRepository.createTask(completeTaskData);
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
    if (updateData.assignees) {
      updateData.assignees = updateData.assignees.map((id: any) => new mongoose.Types.ObjectId(id.toString()));
    }

    const updatedTask = await taskRepository.updateTask(taskId, updateData);
    if (!updatedTask) {
      throw new NotFoundError("Task could not be updated");
    }

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

    await taskRepository.deleteTask(taskId);
  }
}

export const taskService = new TaskService();
