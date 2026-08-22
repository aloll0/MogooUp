import { ActivityLogModel, IActivityLog } from "./activity.model";
import mongoose from "mongoose";

export class ActivityService {
  /**
   * Logs a new activity in the database.
   */
  async logActivity(activityData: {
    workspaceId?: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    entityType: "task" | "workspace" | "list" | "space" | "folder";
    entityId: string | mongoose.Types.ObjectId;
    action: "created" | "updated" | "deleted" | "moved";
    details?: Record<string, any>;
  }): Promise<IActivityLog> {
    const log = await ActivityLogModel.create({
      workspaceId: activityData.workspaceId ? new mongoose.Types.ObjectId(activityData.workspaceId.toString()) : undefined,
      userId: new mongoose.Types.ObjectId(activityData.userId.toString()),
      entityType: activityData.entityType,
      entityId: new mongoose.Types.ObjectId(activityData.entityId.toString()),
      action: activityData.action,
      details: activityData.details || {},
    });
    return log;
  }

  /**
   * Retrieves all populated activity logs across the entire system.
   */
  async getGlobalActivities(limit: number = 100): Promise<IActivityLog[]> {
    return ActivityLogModel.find({})
      .populate("userId", "fullName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Retrieves all populated activity logs associated with a specific task (sorted chronologically).
   */
  async getTaskActivities(taskId: string): Promise<IActivityLog[]> {
    return ActivityLogModel.find({
      entityType: "task",
      entityId: new mongoose.Types.ObjectId(taskId),
    })
      .populate("userId", "fullName avatarUrl")
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Retrieves all populated activity logs for a workspace.
   */
  async getWorkspaceActivities(workspaceId: string, limit: number = 50): Promise<IActivityLog[]> {
    return ActivityLogModel.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    })
      .populate("userId", "fullName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

export const activityService = new ActivityService();
