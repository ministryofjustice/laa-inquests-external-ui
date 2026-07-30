import type { z } from "zod";
import type {
  UploadEvidenceRequestSchema,
  UploadEvidenceResponseSchema,
} from "./UploadEvidence.schema.js";

export type UploadEvidenceRequest = z.infer<typeof UploadEvidenceRequestSchema>;

export type UploadEvidenceResponse = z.infer<
  typeof UploadEvidenceResponseSchema
>;
