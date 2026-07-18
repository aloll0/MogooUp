import { Schema, model, Document, Types } from "mongoose";

export type NotificationType = "task_assigned" | "task_updated" | "comment_mentioned" | "workspace_invite";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  entityId?: Types.ObjectId;
  entityType?: "task" | "workspace";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["task_assigned", "task_updated", "comment_mentioned", "workspace_invite"],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    entityType: {
      type: String,
      enum: ["task", "workspace"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const NotificationModel = model<INotification>("Notification", notificationSchema);
