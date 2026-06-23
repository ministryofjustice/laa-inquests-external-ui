import { z } from "zod";

export const SaveCoronersLetterRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
});

export const SaveCoronersLetterResponseSchema = z.object({
  status: z.string(),
  fileId: z.string(),
});
