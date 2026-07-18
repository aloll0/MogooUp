import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createFolderSchema = z.object({
  body: z.object({
    spaceId: z
      .string({ required_error: "Space ID is required" })
      .regex(objectIdRegex, "Invalid Space ID format"),
    name: z
      .string({ required_error: "Folder name is required" })
      .min(2, "Folder name must be at least 2 characters long")
      .max(50, "Folder name must be less than 50 characters"),
  }),
});
