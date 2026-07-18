import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTaskSchema = z.object({
  body: z.object({
    listId: z
      .string({ required_error: "List ID is required" })
      .regex(objectIdRegex, "Invalid List ID format"),
    title: z
      .string({ required_error: "Task title is required" })
      .min(2, "Task title must be at least 2 characters long")
      .max(100, "Task title must be less than 100 characters"),
    description: z.string().default(""),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignees: z.array(z.string().regex(objectIdRegex, "Invalid User ID in assignees")).optional(),
    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          publicId: z.string(),
          size: z.number(),
        })
      )
      .optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    listId: z.string().regex(objectIdRegex, "Invalid List ID format").optional(),
    title: z
      .string()
      .min(2, "Task title must be at least 2 characters long")
      .max(100, "Task title must be less than 100 characters")
      .optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignees: z.array(z.string().regex(objectIdRegex, "Invalid User ID in assignees")).optional(),
    position: z.number().optional(),
    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          publicId: z.string(),
          size: z.number(),
        })
      )
      .optional(),
  }),
});
