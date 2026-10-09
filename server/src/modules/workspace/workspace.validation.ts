import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Workspace name is required" })
      .min(2, "Workspace name must be at least 2 characters long")
      .max(50, "Workspace name must be less than 50 characters"),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes")
      .optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Workspace name must be at least 2 characters long")
      .max(50, "Workspace name must be less than 50 characters")
      .optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes")
      .optional(),
  }),
});

const permissionsObject = z.object({
  canCreateTasks: z.boolean().optional(),
  canEditTasks: z.boolean().optional(),
  canDeleteTasks: z.boolean().optional(),
  canChangeTaskStatus: z.boolean().optional(),
  canAssignTasks: z.boolean().optional(),
  canCommentOnTasks: z.boolean().optional(),
  canDeleteComments: z.boolean().optional(),
  canCreateSpaces: z.boolean().optional(),
  canManageSpaces: z.boolean().optional(),
  canDeleteSpaces: z.boolean().optional(),
  canManageLists: z.boolean().optional(),
  canInviteMembers: z.boolean().optional(),
  canManageRoles: z.boolean().optional(),
  canRemoveMembers: z.boolean().optional(),
  canViewClients: z.boolean().optional(),
  canManageClients: z.boolean().optional(),
  canDeleteClients: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canExportData: z.boolean().optional(),
  canManageGoals: z.boolean().optional(),
  canManageWorkspaceSettings: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
    role: z
      .enum(["admin", "manager", "member", "guest"], {
        errorMap: () => ({ message: "Invalid workspace role" }),
      }),
    permissions: permissionsObject.optional(),
    allowedSpaces: z.array(z.string()).optional(),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    userId: z
      .string({ required_error: "User ID is required" }),
    role: z
      .enum(["admin", "manager", "member", "guest"], {
        errorMap: () => ({ message: "Invalid workspace role" }),
      })
      .optional(),
    permissions: permissionsObject.optional(),
    allowedSpaces: z.array(z.string()).optional(),
  }),
});

