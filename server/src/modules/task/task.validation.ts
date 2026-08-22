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
    assignees: z
      .array(z.string().regex(objectIdRegex, "Invalid User ID in assignees"))
      .min(1, "Assigned employee is required"),
    startDate: z.string().datetime().nullable().optional(),
    dueDate: z.string({ required_error: "Due date is required" }).datetime(),
    clientProjectId: z
      .string({ required_error: "Company/Client is required" })
      .regex(objectIdRegex, "Invalid Company/Client ID"),
    projectName: z
      .string({ required_error: "Project/Service is required" })
      .min(2, "Project name must be at least 2 characters long"),
    notes: z.string().optional(),
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
    timeEstimate: z.number().min(0).optional(),
    loggedTime: z
      .array(
        z.object({
          userId: z.string().regex(objectIdRegex, "Invalid User ID in loggedTime"),
          hours: z.number().min(0),
          comment: z.string().optional(),
          date: z.string().optional(),
        })
      )
      .optional(),
    checklist: z
      .array(
        z.object({
          _id: z.string().optional(),
          title: z.string(),
          isCompleted: z.boolean().default(false),
        })
      )
      .optional(),
    tags: z.array(z.string()).optional(),
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
    startDate: z.string().datetime().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    clientProjectId: z.string().regex(objectIdRegex, "Invalid Company/Client ID").optional(),
    projectName: z.string().min(2).optional(),
    notes: z.string().optional(),
    delayReason: z.string().optional(),
    cancellationReason: z.string().optional(),
    blockedReason: z.string().optional(),
    rejectedReason: z.string().optional(),
    revisionReason: z.string().optional(),
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
    timeEstimate: z.number().min(0).optional(),
    loggedTime: z
      .array(
        z.object({
          userId: z.string().regex(objectIdRegex, "Invalid User ID in loggedTime"),
          hours: z.number().min(0),
          comment: z.string().optional(),
          date: z.string().optional(),
        })
      )
      .optional(),
    checklist: z
      .array(
        z.object({
          _id: z.string().optional(),
          title: z.string(),
          isCompleted: z.boolean().default(false),
        })
      )
      .optional(),
    tags: z.array(z.string()).optional(),
  }),
});
