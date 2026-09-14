import type { Readable } from "node:stream";

export type EvidenceDisposition = "inline" | "attachment";

export interface DownloadEvidenceRequest {
  claimEvidenceId: string;
  disposition: EvidenceDisposition;
}

// Download is a read/stream: absence is an expected NOT_FOUND value; transport
// and malformed failures are thrown as sanitized ApplicationError.
export type DownloadEvidenceResponse =
  | {
      status: "SUCCESS";
      stream: Readable;
      contentType: string;
      contentDisposition: string;
    }
  | { status: "NOT_FOUND" };
