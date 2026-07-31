import type { z } from "zod";
import type {
  DeleteEvidenceRequestSchema,
  DeleteEvidenceResponseSchema,
} from "./DeleteEvidence.schema.js";

export type DeleteEvidenceRequest = z.infer<typeof DeleteEvidenceRequestSchema>;

export type DeleteEvidenceResponse = z.infer<typeof DeleteEvidenceResponseSchema>;
