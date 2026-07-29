import type {
  UploadEvidenceRequest,
  UploadEvidenceResponse,
} from "#src/adaptors/source/inquests-api/claim/UploadEvidence/models/UploadEvidence.types.js";

export interface UploadEvidencePort {
  uploadEvidence: (
    body: UploadEvidenceRequest,
    accessToken: string | undefined,
  ) => Promise<UploadEvidenceResponse>;
}
