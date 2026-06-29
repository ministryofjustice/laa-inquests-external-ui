import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";

interface UploadCoronersLetterInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface UploadCoronersLetterOutput {
  coronersLetterId: string;
}

export class UploadCoronersLetterUseCase {
  uploadCoronersLetterPort: UploadCoronersLetterPort;

  constructor(uploadCoronersLetterPort: UploadCoronersLetterPort) {
    this.uploadCoronersLetterPort = uploadCoronersLetterPort;
  }

  async execute(
    input: UploadCoronersLetterInput,
  ): Promise<UseCaseResult<UploadCoronersLetterOutput>> {
    const { buffer, mimetype, originalname } = input;

    try {
      const responseRaw =
        await this.uploadCoronersLetterPort.uploadCoronersLetter({
          buffer,
          mimetype,
          originalname,
        });

      const { status } = responseRaw;

      if (status === "SUCCESS") {
        if (
          typeof responseRaw.coronersLetterId === "string" &&
          responseRaw.coronersLetterId !== ""
        ) {
          return {
            status: "SUCCESS",
            data: { coronersLetterId: responseRaw.coronersLetterId },
          };
        } else {
          return {
            status: "TECHNICAL_FAILURE",
            reason: "UNEXPECTED_EXCEPTION",
          };
        }
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
