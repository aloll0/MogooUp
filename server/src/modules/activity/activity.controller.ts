import { Request, Response, NextFunction } from "express";
import { activityService } from "./activity.service";
import { workspaceRepository } from "../workspace/workspace.repository";
import { ForbiddenError } from "../../utils/errors";

export class ActivityController {
  /**
   * Retrieves task activity history.
   */
  getTaskActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.userId;

      // Verify task access by checking workspace membership
      const taskModel = require("../task/task.model").TaskModel;
      const task = await taskModel.findById(taskId);
      if (task) {
        const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
        if (!membership || membership.status !== "active") {
          throw new ForbiddenError("You are not authorized to view activity logs for this task");
        }
      }

      const activities = await activityService.getTaskActivities(taskId);

      res.status(200).json({
        success: true,
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves workspace activity logs.
   */
  getWorkspaceActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;

      const membership = await workspaceRepository.findMembership(workspaceId, userId);
      if (!membership || membership.status !== "active") {
        throw new ForbiddenError("You are not authorized to view activity logs for this workspace");
      }

      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const activities = await activityService.getWorkspaceActivities(workspaceId, limit);

      res.status(200).json({
        success: true,
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves global system-wide activity logs.
   */
  getSystemActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userModel = require("../user/user.model").UserModel;
      const user = await userModel.findById(req.user!.userId);
      if (!user || !user.isSystemAdmin) {
        throw new ForbiddenError("Only system administrators can view global system logs");
      }

      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const activities = await activityService.getGlobalActivities(limit);

      res.status(200).json({
        success: true,
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const activityController = new ActivityController();
