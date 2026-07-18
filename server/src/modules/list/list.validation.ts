import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createListSchema = z.object({
  body: z.object({
    spaceId: z
      .string({ required_error: "Space ID is required" })
      .regex(objectIdRegex, "Invalid Space ID format"),
    folderId: z
      .string()
      .regex(objectIdRegex, "Invalid Folder ID format")
      .nullable()
      .optional(),
    name: z
      .string({ required_error: "List name is required" })
      .min(2, "List name must be at least 2 characters long")
      .max(50, "List name must be less than 50 characters"),
    position: z.number().optional(),
  }),
});

export const updateListSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "List name must be at least 2 characters long")
      .max(50, "List name must be less than 50 characters")
      .optional(),
    position: z.number().optional(),
  }),
});
