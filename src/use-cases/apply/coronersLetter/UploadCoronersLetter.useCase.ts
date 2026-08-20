import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

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
          logger.logInfo({
            functionName: "uploadCoronersLetterUseCase_execute",
            message: "Coroners letter upload completed successfully",
            extraContext: {
              event: "apply_coroners_letter_upload_completed",
              outcome: "SUCCESS",
              file_id: responseRaw.coronersLetterId,
            },
          });
          return {
            status: "SUCCESS",
            data: {
              coronersLetterId: responseRaw.coronersLetterId,
              coronersLetterFileName: responseRaw.coronersLetterFileName,
            },
          };
        } else {
          logger.logError({
            functionName: "uploadCoronersLetterUseCase_execute",
            message: "Coroners letter upload returned invalid success payload",
            extraContext: {
              event: "apply_coroners_letter_upload_failed",
              reason: "UNEXPECTED_EXCEPTION",
            },
          });
          return {
            status: "TECHNICAL_FAILURE",
            reason: "UNEXPECTED_EXCEPTION",
          };
        }
      }

      logger.logError({
        functionName: "uploadCoronersLetterUseCase_execute",
        message: "Coroners letter upload rejected by downstream component",
        extraContext: {
          event: "apply_coroners_letter_upload_failed",
          reason: responseRaw.reason,
        },
      });

      return {
        status: "TECHNICAL_FAILURE",
        reason: responseRaw.reason as TechnicalFailureReason,
      };
    } catch (err) {
      logger.logError({
        functionName: "uploadCoronersLetterUseCase_execute",
        message: "Coroners letter upload failed with exception",
        err,
        extraContext: {
          event: "apply_coroners_letter_upload_failed",
          reason: "UNEXPECTED_EXCEPTION",
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
