import type { CorrespondenceRecipientSelectionValue } from "#src/adaptors/presenters/apply/models/form.types.js";
import { CORRESPONDENCE_RECIPIENT_TYPE } from "#src/infrastructure/locales/constants.js";
import { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

interface UpdateCorrespondenceRecipientOutput {
  clientCorrespondenceRecipient: CorrespondenceRecipient | null;
}

export class UpdateCorrespondenceRecipientUseCase {
  execute(
    correspondenceRecipient: unknown,
    personName: string | undefined,
    organisationName: string | undefined,
  ): UseCaseResult<UpdateCorrespondenceRecipientOutput> {
    if (!this.#isCorrespondenceRecipientSelection(correspondenceRecipient)) {
      logger.logInfo({
        functionName: "updateCorrespondenceRecipientUseCase_execute",
        message: "Correspondence recipient selection was invalid",
        extraContext: {
          event: "apply_correspondence_recipient_update_failed",
          reason: "INVALID_INPUT_STATE",
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    if (correspondenceRecipient === "NONE") {
      logger.logDebug({
        functionName: "updateCorrespondenceRecipientUseCase_execute",
        message: "Correspondence recipient none",
        extraContext: {
          event: "apply_correspondence_recipient_updated",
          outcome: "CLEARED",
        },
      });
      return {
        status: "SUCCESS",
        data: {
          clientCorrespondenceRecipient: null,
        },
      };
    }

    const recipientName =
      correspondenceRecipient === CORRESPONDENCE_RECIPIENT_TYPE.PERSON
        ? personName
        : organisationName;

    logger.logInfo({
      functionName: "updateCorrespondenceRecipientUseCase_execute",
      message: "Correspondence recipient updated",
      extraContext: {
        event: "apply_correspondence_recipient_updated",
        outcome: "SET",
        recipient_type: correspondenceRecipient,
      },
    });

    return {
      status: "SUCCESS",
      data: {
        clientCorrespondenceRecipient: new CorrespondenceRecipient(
          correspondenceRecipient,
          recipientName ?? "",
        ),
      },
    };
  }

  #isCorrespondenceRecipientSelection(
    value: unknown,
  ): value is CorrespondenceRecipientSelectionValue {
    return (
      value === CORRESPONDENCE_RECIPIENT_TYPE.PERSON ||
      value === CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION ||
      value === "NONE"
    );
  }
}
