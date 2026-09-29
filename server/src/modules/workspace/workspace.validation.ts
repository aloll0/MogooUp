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
  canManageLists: z.boolean().optional(),
  canManageSpaces: z.boolean().optional(),
  canInviteMembers: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canManageClients: z.boolean().optional(),
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
  }),
});

