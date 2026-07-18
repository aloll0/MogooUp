import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createSpaceSchema = z.object({
  body: z.object({
    workspaceId: z
      .string({ required_error: "Workspace ID is required" })
      .regex(objectIdRegex, "Invalid Workspace ID format"),
    name: z
      .string({ required_error: "Space name is required" })
      .min(2, "Space name must be at least 2 characters long")
      .max(50, "Space name must be less than 50 characters"),
    description: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g. #aa3bff)")
      .optional(),
    isPrivate: z.boolean().optional(),
    allowedMembers: z
      .array(z.string().regex(objectIdRegex, "Invalid User ID in allowedMembers"))
      .optional(),
  }),
});

export const updateSpaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Space name must be at least 2 characters long")
      .max(50, "Space name must be less than 50 characters")
      .optional(),
    description: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g. #aa3bff)")
      .optional(),
    isPrivate: z.boolean().optional(),
    allowedMembers: z
      .array(z.string().regex(objectIdRegex, "Invalid User ID in allowedMembers"))
      .optional(),
  }),
});
