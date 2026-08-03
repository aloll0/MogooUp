import { Schema, model, Document, Types } from "mongoose";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface IAttachment {
  name: string;
  url: string;
  publicId: string;
  size: number;
}

export interface ILoggedTime {
  userId: Types.ObjectId;
  hours: number;
  comment?: string;
  date?: Date;
}

export interface ITask extends Document {
  workspaceId: Types.ObjectId;
  spaceId: Types.ObjectId;
  listId: Types.ObjectId;
  parentTaskId?: Types.ObjectId;
  title: string;
  description: string;
  status: string; // e.g., 'to-do', 'in-progress', 'done'
  priority: TaskPriority;
  assignees: Types.ObjectId[];
  reporterId: Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  tags: string[];
  attachments: IAttachment[];
  position: number;
  timeEstimate?: number;
  loggedTime?: ILoggedTime[];
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  size: { type: Number, required: true },
});

const taskSchema = new Schema<ITask>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: "List",
      required: true,
      index: true,
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "to-do",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    position: {
      type: Number,
      default: 0,
    },
    timeEstimate: {
      type: Number,
      default: 0,
    },
    loggedTime: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          hours: { type: Number, required: true },
          comment: { type: String, default: "" },
          date: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes to improve query speeds on workspace pipelines
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ listId: 1, position: 1 });

export const TaskModel = model<ITask>("Task", taskSchema);
