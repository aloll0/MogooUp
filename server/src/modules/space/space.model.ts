import { Schema, model, Document, Types } from "mongoose";

export interface ISpace extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  isPrivate: boolean;
  allowedMembers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const spaceSchema = new Schema<ISpace>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Space name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#aa3bff", // default Taskflow purple color accent
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    allowedMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SpaceModel = model<ISpace>("Space", spaceSchema);
