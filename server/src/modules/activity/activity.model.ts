import { Schema, model, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  entityType: "task" | "workspace" | "list" | "space" | "folder";
  entityId: Types.ObjectId;
  action: "created" | "updated" | "deleted" | "moved";
  details?: Schema.Types.Mixed;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["task", "workspace", "list", "space", "folder"],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "moved"],
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log when it was created
    versionKey: false,
  }
);

export const ActivityLogModel = model<IActivityLog>("ActivityLog", activityLogSchema);
