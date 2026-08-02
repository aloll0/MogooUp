import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";

export class NotificationController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const notifications = await notificationService.getNotifications(userId);
      res.status(200).json({
        success: true,
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const notification = await notificationService.markAsRead(id, userId);
      res.status(200).json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      await notificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
