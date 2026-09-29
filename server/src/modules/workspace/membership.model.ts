import { Schema, model, Document, Types } from "mongoose";

export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "guest";
export type MembershipStatus = "active" | "invited" | "suspended";

export interface IWorkspacePermissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageLists: boolean;
  canManageSpaces: boolean;
  canInviteMembers: boolean;
  canViewReports: boolean;
  canManageClients: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<WorkspaceRole, IWorkspacePermissions> = {
  owner: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canManageLists: true,
    canManageSpaces: true,
    canInviteMembers: true,
    canViewReports: true,
    canManageClients: true,
  },
  admin: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canManageLists: true,
    canManageSpaces: true,
    canInviteMembers: true,
    canViewReports: true,
    canManageClients: true,
  },
  manager: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageLists: true,
    canManageSpaces: true,
    canInviteMembers: true,
    canViewReports: true,
    canManageClients: true,
  },
  member: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageLists: false,
    canManageSpaces: false,
    canInviteMembers: false,
    canViewReports: true,
    canManageClients: false,
  },
  guest: {
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canManageLists: false,
    canManageSpaces: false,
    canInviteMembers: false,
    canViewReports: false,
    canManageClients: false,
  },
};

export interface IMembership extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  status: MembershipStatus;
  permissions: IWorkspacePermissions;
  createdAt: Date;
  updatedAt: Date;
}

const permissionsSchema = new Schema<IWorkspacePermissions>(
  {
    canCreateTasks: { type: Boolean, default: true },
    canEditTasks: { type: Boolean, default: true },
    canDeleteTasks: { type: Boolean, default: false },
    canManageLists: { type: Boolean, default: false },
    canManageSpaces: { type: Boolean, default: false },
    canInviteMembers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageClients: { type: Boolean, default: false },
  },
  { _id: false }
);

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
    permissions: {
      type: permissionsSchema,
      default: () => ({ ...DEFAULT_ROLE_PERMISSIONS.member }),
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

