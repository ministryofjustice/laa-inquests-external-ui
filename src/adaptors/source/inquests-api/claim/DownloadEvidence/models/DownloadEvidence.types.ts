import type { Readable } from "node:stream";

export type EvidenceDisposition = "inline" | "attachment";

export interface DownloadEvidenceRequest {
  claimEvidenceId: string;
  disposition: EvidenceDisposition;
}

export type DownloadEvidenceResponse =
  | {
      status: "SUCCESS";
      stream: Readable;
      contentType: string;
      contentDisposition: string;
    }
  | {
      status: "TECHNICAL_FAILURE";
      reason: "NOT_FOUND" | "UPSTREAM_REJECTED" | "UNEXPECTED_EXCEPTION";
    };
