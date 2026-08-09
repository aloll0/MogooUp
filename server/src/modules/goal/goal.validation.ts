import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const keyResultValidationSchema = z.object({
  _id: z.string().regex(objectIdRegex).optional(),
  title: z.string().min(1, "Key Result title is required"),
  targetType: z.enum(["percentage", "number"]),
  startValue: z.number().default(0),
  targetValue: z.number().default(100),
  currentValue: z.number().default(0),
  unit: z.string().default("%"),
});

export const createGoalSchema = z.object({
  body: z.object({
    workspaceId: z.string().regex(objectIdRegex, "Invalid Workspace ID format"),
    title: z.string().min(2, "Goal title must be at least 2 characters long"),
    description: z.string().optional(),
    status: z.enum(["active", "completed", "cancelled"]).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    keyResults: z.array(keyResultValidationSchema).optional(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Goal title must be at least 2 characters long").optional(),
    description: z.string().optional(),
    status: z.enum(["active", "completed", "cancelled"]).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    keyResults: z.array(keyResultValidationSchema).optional(),
  }),
});
