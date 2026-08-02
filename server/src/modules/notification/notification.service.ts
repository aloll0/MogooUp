import { notificationRepository } from "./notification.repository";
import { INotification, NotificationType } from "./notification.model";
import { NotFoundError } from "../../utils/errors";

export class NotificationService {
  async getNotifications(userId: string): Promise<INotification[]> {
    return notificationRepository.findByUser(userId);
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const updated = await notificationRepository.markAsRead(notificationId, userId);
    if (!updated) {
      throw new NotFoundError("Notification not found");
    }
    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  async createNotification(
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType,
    senderId?: string,
    entityId?: string,
    entityType?: "task" | "workspace"
  ): Promise<INotification> {
    return notificationRepository.createNotification(
      recipientId,
      title,
      message,
      type,
      senderId,
      entityId,
      entityType
    );
  }
}

export const notificationService = new NotificationService();
