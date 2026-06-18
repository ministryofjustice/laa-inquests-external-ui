import { z } from "zod";

export const SaveCoronersLetterRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
});

export const SaveCoronersLetterResponseSchema = z.object({
  statusCode: z.number(),
  fileId: z.string(),
});
