import { z } from "zod";

export const UploadCoronersLetterRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
});

export const UploadCoronersLetterApiResponseSchema = z.object({
  coronersLetterId: z.string(),
  coronersLetterFileName: z.string(),
});
