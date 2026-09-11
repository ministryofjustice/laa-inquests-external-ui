import { z } from "zod";

export const UploadEvidenceRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
});

export const UploadEvidenceApiResponseSchema = z.object({
  claimEvidenceId: z.string(),
  claimEvidenceFileName: z.string(),
});
