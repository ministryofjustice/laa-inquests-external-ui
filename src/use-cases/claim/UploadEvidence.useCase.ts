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

      const { status } = responseRaw;

      if (status === "SUCCESS") {
        if (
          typeof responseRaw.evidenceFileId === "string" &&
          responseRaw.evidenceFileId !== "" &&
          typeof responseRaw.evidenceFileName === "string" &&
          responseRaw.evidenceFileName !== ""
        ) {
          return {
            status: "SUCCESS",
            data: {
              evidenceFileId: responseRaw.evidenceFileId,
              evidenceFileName: responseRaw.evidenceFileName,
            },
          };
        }

        return {
          status: "TECHNICAL_FAILURE",
          reason: "UNEXPECTED_EXCEPTION",
        };
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
