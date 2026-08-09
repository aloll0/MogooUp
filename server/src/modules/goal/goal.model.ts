import { Schema, model, Document, Types } from "mongoose";

export interface IKeyResult {
  _id: Types.ObjectId;
  title: string;
  targetType: "percentage" | "number";
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
}

export interface IGoal extends Document {
  workspaceId: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  status: "active" | "completed" | "cancelled";
  startDate?: Date;
  endDate?: Date;
  keyResults: IKeyResult[];
  createdAt: Date;
  updatedAt: Date;
}

const keyResultSchema = new Schema<IKeyResult>({
  title: { type: String, required: true, trim: true },
  targetType: { type: String, enum: ["percentage", "number"], default: "percentage" },
  startValue: { type: Number, default: 0 },
  targetValue: { type: Number, default: 100 },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, default: "%" },
});

const goalSchema = new Schema<IGoal>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    keyResults: {
      type: [keyResultSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const GoalModel = model<IGoal>("Goal", goalSchema);
