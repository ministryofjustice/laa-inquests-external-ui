import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";

interface DeleteEvidenceInput {
  evidenceFileId: string;
  accessToken?: string;
}

export class DeleteEvidenceUseCase {
  deleteEvidencePort: DeleteEvidencePort;

  constructor(deleteEvidencePort: DeleteEvidencePort) {
    this.deleteEvidencePort = deleteEvidencePort;
  }

  async execute(input: DeleteEvidenceInput): Promise<UseCaseResult> {
    const { evidenceFileId, accessToken } = input;

    if (evidenceFileId === "") {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    try {
      const responseRaw = await this.deleteEvidencePort.deleteEvidence(
        { evidenceFileId },
        accessToken,
      );

      if (responseRaw.status === "SUCCESS") {
        return { status: "SUCCESS" };
      }

      return {
        status: "TECHNICAL_FAILURE",
        reason: responseRaw.reason as TechnicalFailureReason,
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
