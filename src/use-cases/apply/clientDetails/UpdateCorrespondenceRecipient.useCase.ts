import type { CorrespondenceRecipientSelectionValue } from "#src/adaptors/presenters/apply/models/form.types.js";
import { CORRESPONDENCE_RECIPIENT_TYPE } from "#src/infrastructure/locales/constants.js";
import { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

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
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    if (correspondenceRecipient === "NONE") {
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
