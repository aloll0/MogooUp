import { TaskModel, ITask } from "./task.model";
import mongoose from "mongoose";

export class TaskRepository {
  async findById(id: string): Promise<ITask | null> {
    return TaskModel.findOne({ _id: id, deleted: { $ne: true } })
      .populate("assignees", "fullName email avatarUrl")
      .populate("reporterId", "fullName email avatarUrl")
      .exec();
  }

  async findByList(listId: string): Promise<ITask[]> {
    return TaskModel.find({ listId: new mongoose.Types.ObjectId(listId), deleted: { $ne: true } })
      .sort({ position: 1 })
      .populate("assignees", "fullName email avatarUrl")
      .exec();
  }

  async findTasks(filter: Record<string, any>, sort: Record<string, any> = { position: 1 }): Promise<ITask[]> {
    const combinedFilter = { ...filter, deleted: { $ne: true } };
    return TaskModel.find(combinedFilter)
      .sort(sort)
      .populate("assignees", "fullName email avatarUrl")
      .exec();
  }

  async createTask(taskData: Partial<ITask>): Promise<ITask> {
    const task = await TaskModel.create(taskData);
    return task.populate("assignees", "fullName email avatarUrl");
  }

  async updateTask(id: string, updateData: Record<string, any>): Promise<ITask | null> {
    return TaskModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate("assignees", "fullName email avatarUrl")
      .populate("reporterId", "fullName email avatarUrl")
      .exec();
  }

  async deleteTask(id: string, userId?: string): Promise<ITask | null> {
    return TaskModel.findByIdAndUpdate(id, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined
    }, { new: true }).exec();
  }
}

export const taskRepository = new TaskRepository();
