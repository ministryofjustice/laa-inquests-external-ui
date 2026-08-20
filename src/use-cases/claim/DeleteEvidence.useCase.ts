import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

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
      logger.logWarn({
        functionName: "deleteEvidenceUseCase_execute",
        message: "Evidence delete received invalid input",
        extraContext: {
          event: "claim_evidence_delete_failed",
          reason: "INVALID_INPUT_STATE",
        },
      });
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

      logger.logWarn({
        functionName: "deleteEvidenceUseCase_execute",
        message: "Evidence delete rejected by downstream component",
        extraContext: {
          event: "claim_evidence_delete_failed",
          reason: responseRaw.reason,
          file_id: evidenceFileId,
        },
      });

      return {
        status: "TECHNICAL_FAILURE",
        reason: responseRaw.reason as TechnicalFailureReason,
      };
    } catch (err) {
      logger.logError({
        functionName: "deleteEvidenceUseCase_execute",
        message: "Evidence delete failed with exception",
        err,
        extraContext: {
          event: "claim_evidence_delete_failed",
          reason: "UNEXPECTED_EXCEPTION",
          file_id: evidenceFileId,
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
