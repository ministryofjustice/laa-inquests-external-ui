import { z } from "zod";

export const UploadCoronersLetterRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
});

export const UploadCoronersLetterResponseSchema = z.object({
  status: z.string(),
  coronersLetterId: z.string().optional(),
  reason: z.string().optional(),
});
