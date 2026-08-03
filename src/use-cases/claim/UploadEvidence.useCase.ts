import type { UploadEvidencePort } from "#src/ports/source/inquests-api/UploadEvidence.port.js";
import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";

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
        return this.#technicalFailure(
          responseRaw.reason as TechnicalFailureReason,
        );
      }
    } catch {
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
