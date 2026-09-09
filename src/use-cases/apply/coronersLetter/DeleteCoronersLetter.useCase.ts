import type {
  TechnicalFailureReason,
  UseCaseResult,
} from "#src/use-cases/common/useCaseResult.types.js";
import type { DeleteCoronersLetterPort } from "#src/ports/source/inquests-api/DeleteCoronersLetter.port.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

interface DeleteCoronersLetterInput {
  coronersLetterId: string;
  accessToken?: string;
}

export class DeleteCoronersLetterUseCase {
  deleteCoronersLetterPort: DeleteCoronersLetterPort;

  constructor(deleteCoronersLetterPort: DeleteCoronersLetterPort) {
    this.deleteCoronersLetterPort = deleteCoronersLetterPort;
  }

  async execute(input: DeleteCoronersLetterInput): Promise<UseCaseResult> {
    const { coronersLetterId, accessToken } = input;

    if (coronersLetterId === "") {
      logger.logWarn({
        functionName: "deleteCoronersLetterUseCase_execute",
        message: "Coroners letter delete received invalid input",
        extraContext: {
          event: "apply_coroners_letter_delete_failed",
          reason: "INVALID_INPUT_STATE",
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    try {
      const responseRaw =
        await this.deleteCoronersLetterPort.deleteCoronersLetter(
          { coronersLetterId },
          accessToken,
        );

      if (responseRaw.status === "SUCCESS") {
        return { status: "SUCCESS" };
      }

      logger.logWarn({
        functionName: "deleteCoronersLetterUseCase_execute",
        message: "Coroners letter delete rejected by downstream component",
        extraContext: {
          event: "apply_coroners_letter_delete_failed",
          reason: responseRaw.reason,
          file_id: coronersLetterId,
        },
      });

      return {
        status: "TECHNICAL_FAILURE",
        reason: responseRaw.reason as TechnicalFailureReason,
      };
    } catch (err) {
      logger.logError({
        functionName: "deleteCoronersLetterUseCase_execute",
        message: "Coroners letter delete failed with exception",
        err,
        extraContext: {
          event: "apply_coroners_letter_delete_failed",
          reason: "UNEXPECTED_EXCEPTION",
          file_id: coronersLetterId,
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
