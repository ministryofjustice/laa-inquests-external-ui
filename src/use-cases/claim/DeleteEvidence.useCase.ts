import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import type { DeleteEvidenceResponse } from "#src/adaptors/source/inquests-api/claim/DeleteEvidence/models/DeleteEvidence.types.js";

interface DeleteEvidenceInput {
  evidenceFileId: string;
  accessToken?: string;
}

export class DeleteEvidenceUseCase {
  deleteEvidencePort: DeleteEvidencePort;

  constructor(deleteEvidencePort: DeleteEvidencePort) {
    this.deleteEvidencePort = deleteEvidencePort;
  }

  async execute(input: DeleteEvidenceInput): Promise<DeleteEvidenceResponse> {
    const { evidenceFileId, accessToken } = input;

    if (evidenceFileId === "") {
      return { status: "DELETE_REJECTED" };
    }

    return await this.deleteEvidencePort.deleteEvidence(
      { evidenceFileId },
      accessToken,
    );
  }
}
