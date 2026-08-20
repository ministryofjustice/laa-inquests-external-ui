import type { UploadEvidencePort } from "#src/ports/source/inquests-api/UploadEvidence.port.js";
import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

interface UploadEvidenceInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  accessToken?: string;
}

interface UploadEvidenceOutput {
  evidenceFileId: string;
  evidenceFileName: string;
}

export class UploadEvidenceUseCase {
  uploadEvidencePort: UploadEvidencePort;

  constructor(uploadEvidencePort: UploadEvidencePort) {
    this.uploadEvidencePort = uploadEvidencePort;
  }

  async execute(
    input: UploadEvidenceInput,
  ): Promise<UseCaseResult<UploadEvidenceOutput>> {
    const { buffer, mimetype, originalname, accessToken } = input;

    try {
      const responseRaw = await this.uploadEvidencePort.uploadEvidence(
        {
          buffer,
          mimetype,
          originalname,
        },
        accessToken,
      );

      if (responseRaw.status === "SUCCESS") {
        const { evidenceFileId, evidenceFileName } = responseRaw;
        if (
          typeof evidenceFileId !== "string" ||
          evidenceFileId === "" ||
          typeof evidenceFileName !== "string" ||
          evidenceFileName === ""
        ) {
          logger.logError({
            functionName: "uploadEvidenceUseCase_execute",
            message: "Upload evidence returned invalid success payload",
            extraContext: {
              event: "claim_evidence_upload_failed",
              reason: "UNEXPECTED_EXCEPTION",
            },
          });
          return this.#technicalFailure("UNEXPECTED_EXCEPTION");
        } else {
          return {
            status: "SUCCESS",
            data: {
              evidenceFileId,
              evidenceFileName,
            },
          };
        }
      } else {
        logger.logWarn({
          functionName: "uploadEvidenceUseCase_execute",
          message: "Upload evidence rejected by API",
          extraContext: {
            event: "claim_evidence_upload_failed",
            reason: responseRaw.reason,
          },
        });
        return this.#technicalFailure(
          responseRaw.reason as TechnicalFailureReason,
        );
      }
    } catch (err) {
      logger.logError({
        functionName: "uploadEvidenceUseCase_execute",
        message: "Upload evidence failed with exception",
        err,
        extraContext: {
          event: "claim_evidence_upload_failed",
          reason: "UNEXPECTED_EXCEPTION",
        },
      });
      return this.#technicalFailure("UNEXPECTED_EXCEPTION");
    }
  }

  #technicalFailure(
    reason: TechnicalFailureReason,
  ): UseCaseResult<UploadEvidenceOutput> {
    return {
      status: "TECHNICAL_FAILURE",
      reason,
    };
  }
}
