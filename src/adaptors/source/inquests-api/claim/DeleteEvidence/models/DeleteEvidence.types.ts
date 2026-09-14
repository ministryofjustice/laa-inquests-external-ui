import type { z } from "zod";
import type { DeleteEvidenceRequestSchema } from "./DeleteEvidence.schema.js";

export type DeleteEvidenceRequest = z.infer<typeof DeleteEvidenceRequestSchema>;

// Value-based protocol: a non-success delete is an expected outcome surfaced
// inline, never an ApplicationError.
export type DeleteEvidenceResponse =
  { status: "SUCCESS" } | { status: "DELETE_REJECTED" };
