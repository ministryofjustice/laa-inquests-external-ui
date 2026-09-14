import type { z } from "zod";
import type { UploadEvidenceRequestSchema } from "./UploadEvidence.schema.js";

export type UploadEvidenceRequest = z.infer<typeof UploadEvidenceRequestSchema>;

// Value-based upload protocol (no ApplicationError): every non-success outcome
// is an expected result the upload widget renders inline.
export type UploadEvidenceResponse =
  | { status: "SUCCESS"; evidenceFileId: string; evidenceFileName: string }
  | { status: "FILE_SCAN_FOUND_VIRUS" }
  | { status: "UPLOAD_REJECTED" };
