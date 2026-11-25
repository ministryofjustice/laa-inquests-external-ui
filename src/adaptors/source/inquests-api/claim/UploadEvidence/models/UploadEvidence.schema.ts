import { z } from "zod";

export const UploadEvidenceRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
  officeId: z.string(),
});

export const UploadEvidenceApiResponseSchema = z.object({
  claimEvidenceId: z.string(),
  claimEvidenceFileName: z.string(),
});

// The virus-check 422 has a string detail; only the file-content check returns a code.
export const UploadEvidenceFileRejectionSchema = z.object({
  detail: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
