import { TaskModel, ITask } from "./task.model";
import mongoose from "mongoose";

export class TaskRepository {
  async findById(id: string): Promise<ITask | null> {
    return TaskModel.findById(id)
      .populate("assignees", "fullName email avatarUrl")
      .populate("reporterId", "fullName email avatarUrl")
      .exec();
  }

  async findByList(listId: string): Promise<ITask[]> {
    return TaskModel.find({ listId: new mongoose.Types.ObjectId(listId) })
      .sort({ position: 1 })
      .populate("assignees", "fullName email avatarUrl")
      .exec();
  }

  async findTasks(filter: Record<string, any>, sort: Record<string, any> = { position: 1 }): Promise<ITask[]> {
    return TaskModel.find(filter)
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

  async deleteTask(id: string): Promise<ITask | null> {
    return TaskModel.findByIdAndDelete(id).exec();
  }
}

export const taskRepository = new TaskRepository();
