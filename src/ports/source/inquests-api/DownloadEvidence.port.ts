import type {
  DownloadEvidenceRequest,
  DownloadEvidenceResponse,
} from "#src/adaptors/source/inquests-api/claim/DownloadEvidence/models/DownloadEvidence.types.js";

export interface DownloadEvidencePort {
  downloadEvidence: (
    request: DownloadEvidenceRequest,
    accessToken: string | undefined,
  ) => Promise<DownloadEvidenceResponse>;
}
