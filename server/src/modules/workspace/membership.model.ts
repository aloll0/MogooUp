import { Schema, model, Document, Types } from "mongoose";

export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "guest";
export type MembershipStatus = "active" | "invited" | "suspended";

export interface IMembership extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
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
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "member", "guest"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Enforce unique compound index so a user cannot have duplicate memberships in the same workspace
membershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const MembershipModel = model<IMembership>("Membership", membershipSchema);
