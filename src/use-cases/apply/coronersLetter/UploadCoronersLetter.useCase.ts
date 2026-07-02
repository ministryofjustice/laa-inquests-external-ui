import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";

interface UploadCoronersLetterInput {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  accessToken?: string;
}

interface UploadCoronersLetterOutput {
  coronersLetterId: string;
  coronersLetterFileName: string;
}

export class UploadCoronersLetterUseCase {
  uploadCoronersLetterPort: UploadCoronersLetterPort;

  constructor(uploadCoronersLetterPort: UploadCoronersLetterPort) {
    this.uploadCoronersLetterPort = uploadCoronersLetterPort;
  }

  async execute(
    input: UploadCoronersLetterInput,
  ): Promise<UseCaseResult<UploadCoronersLetterOutput>> {
    const { buffer, mimetype, originalname, accessToken } = input;

    try {
      const responseRaw =
        await this.uploadCoronersLetterPort.uploadCoronersLetter(
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
          typeof responseRaw.coronersLetterId === "string" &&
          responseRaw.coronersLetterId !== "" &&
          typeof responseRaw.coronersLetterFileName === "string" &&
          responseRaw.coronersLetterFileName !== ""
        ) {
          return {
            status: "SUCCESS",
            data: {
              coronersLetterId: responseRaw.coronersLetterId,
              coronersLetterFileName: responseRaw.coronersLetterFileName,
            },
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
