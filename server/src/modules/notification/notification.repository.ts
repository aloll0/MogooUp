import { NotificationModel, INotification, NotificationType } from "./notification.model";
import mongoose from "mongoose";

export class NotificationRepository {
  async createNotification(
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType,
    senderId?: string,
    entityId?: string,
    entityType?: "task" | "workspace"
  ): Promise<INotification> {
    return NotificationModel.create({
      recipientId: new mongoose.Types.ObjectId(recipientId),
      senderId: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
      title,
      message,
      type,
      entityId: entityId ? new mongoose.Types.ObjectId(entityId) : undefined,
      entityType,
    });
  }

  async findByUser(userId: string): Promise<INotification[]> {
    return NotificationModel.find({ recipientId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate("senderId", "fullName email avatarUrl")
      .exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipientId: new mongoose.Types.ObjectId(userId),
      },
      { isRead: true },
      { new: true }
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { recipientId: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true }
    ).exec();
  }
}

export const notificationRepository = new NotificationRepository();
