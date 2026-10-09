import { Schema, model, Document, Types } from "mongoose";

export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "guest";
export type MembershipStatus = "active" | "invited" | "suspended";

export interface IWorkspacePermissions {
  // Tasks
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canChangeTaskStatus: boolean;
  canAssignTasks: boolean;
  canCommentOnTasks: boolean;
  canDeleteComments: boolean;
  // Spaces & Lists
  canCreateSpaces: boolean;
  canManageSpaces: boolean;
  canDeleteSpaces: boolean;
  canManageLists: boolean;
  // Team
  canInviteMembers: boolean;
  canManageRoles: boolean;
  canRemoveMembers: boolean;
  // Clients
  canViewClients: boolean;
  canManageClients: boolean;
  canDeleteClients: boolean;
  // Analytics & Goals
  canViewReports: boolean;
  canExportData: boolean;
  canManageGoals: boolean;
  // Settings
  canManageWorkspaceSettings: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<WorkspaceRole, IWorkspacePermissions> = {
  owner: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: true,
    canCreateSpaces: true,
    canManageSpaces: true,
    canDeleteSpaces: true,
    canManageLists: true,
    canInviteMembers: true,
    canManageRoles: true,
    canRemoveMembers: true,
    canViewClients: true,
    canManageClients: true,
    canDeleteClients: true,
    canViewReports: true,
    canExportData: true,
    canManageGoals: true,
    canManageWorkspaceSettings: true,
  },
  admin: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: true,
    canCreateSpaces: true,
    canManageSpaces: true,
    canDeleteSpaces: true,
    canManageLists: true,
    canInviteMembers: true,
    canManageRoles: true,
    canRemoveMembers: true,
    canViewClients: true,
    canManageClients: true,
    canDeleteClients: true,
    canViewReports: true,
    canExportData: true,
    canManageGoals: true,
    canManageWorkspaceSettings: true,
  },
  manager: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: true,
    canCreateSpaces: true,
    canManageSpaces: true,
    canDeleteSpaces: false,
    canManageLists: true,
    canInviteMembers: true,
    canManageRoles: false,
    canRemoveMembers: false,
    canViewClients: true,
    canManageClients: true,
    canDeleteClients: false,
    canViewReports: true,
    canExportData: true,
    canManageGoals: true,
    canManageWorkspaceSettings: false,
  },
  member: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: false,
    canCreateSpaces: false,
    canManageSpaces: false,
    canDeleteSpaces: false,
    canManageLists: false,
    canInviteMembers: false,
    canManageRoles: false,
    canRemoveMembers: false,
    canViewClients: true,
    canManageClients: false,
    canDeleteClients: false,
    canViewReports: true,
    canExportData: false,
    canManageGoals: false,
    canManageWorkspaceSettings: false,
  },
  guest: {
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canChangeTaskStatus: false,
    canAssignTasks: false,
    canCommentOnTasks: true,
    canDeleteComments: false,
    canCreateSpaces: false,
    canManageSpaces: false,
    canDeleteSpaces: false,
    canManageLists: false,
    canInviteMembers: false,
    canManageRoles: false,
    canRemoveMembers: false,
    canViewClients: false,
    canManageClients: false,
    canDeleteClients: false,
    canViewReports: false,
    canExportData: false,
    canManageGoals: false,
    canManageWorkspaceSettings: false,
  },
};

export interface IMembership extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  status: MembershipStatus;
  permissions: IWorkspacePermissions;
  allowedSpaces?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const permissionsSchema = new Schema<IWorkspacePermissions>(
  {
    canCreateTasks: { type: Boolean, default: true },
    canEditTasks: { type: Boolean, default: true },
    canDeleteTasks: { type: Boolean, default: false },
    canChangeTaskStatus: { type: Boolean, default: true },
    canAssignTasks: { type: Boolean, default: true },
    canCommentOnTasks: { type: Boolean, default: true },
    canDeleteComments: { type: Boolean, default: false },
    canCreateSpaces: { type: Boolean, default: false },
    canManageSpaces: { type: Boolean, default: false },
    canDeleteSpaces: { type: Boolean, default: false },
    canManageLists: { type: Boolean, default: false },
    canInviteMembers: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    canRemoveMembers: { type: Boolean, default: false },
    canViewClients: { type: Boolean, default: true },
    canManageClients: { type: Boolean, default: false },
    canDeleteClients: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canExportData: { type: Boolean, default: false },
    canManageGoals: { type: Boolean, default: false },
    canManageWorkspaceSettings: { type: Boolean, default: false },
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
    allowedSpaces: [
      {
        type: Schema.Types.ObjectId,
        ref: "Space",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Enforce unique compound index so a user cannot have duplicate memberships in the same workspace
membershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const MembershipModel = model<IMembership>("Membership", membershipSchema);

