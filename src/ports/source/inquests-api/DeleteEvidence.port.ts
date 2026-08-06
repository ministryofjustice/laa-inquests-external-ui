import type {
  DeleteEvidenceRequest,
  DeleteEvidenceResponse,
} from "#src/adaptors/source/inquests-api/claim/DeleteEvidence/models/DeleteEvidence.types.js";

export interface DeleteEvidencePort {
  deleteEvidence: (
    body: DeleteEvidenceRequest,
    accessToken: string | undefined,
  ) => Promise<DeleteEvidenceResponse>;
}
