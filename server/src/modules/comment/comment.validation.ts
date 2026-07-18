import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCommentSchema = z.object({
  body: z.object({
    taskId: z
      .string({ required_error: "Task ID is required" })
      .regex(objectIdRegex, "Invalid Task ID format"),
    content: z
      .string({ required_error: "Comment content is required" })
      .min(1, "Comment content cannot be empty"),
    mentions: z.array(z.string().regex(objectIdRegex, "Invalid User ID in mentions")).optional(),
  }),
});
