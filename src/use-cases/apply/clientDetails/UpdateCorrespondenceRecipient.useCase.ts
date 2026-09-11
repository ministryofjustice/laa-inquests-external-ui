import type { CorrespondenceRecipientSelectionValue } from "#src/adaptors/presenters/apply/models/form.types.js";
import { CORRESPONDENCE_RECIPIENT_TYPE } from "#src/infrastructure/locales/constants.js";
import { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";

interface UpdateCorrespondenceRecipientOutput {
  clientCorrespondenceRecipient: CorrespondenceRecipient | null;
}

export class UpdateCorrespondenceRecipientUseCase {
  // Returns undefined when the selection is not a recognised option; the
  // presenter maps that to a form re-render and owns any logging.
  execute(
    correspondenceRecipient: unknown,
    personName: string | undefined,
    organisationName: string | undefined,
  ): UpdateCorrespondenceRecipientOutput | undefined {
    if (!this.#isCorrespondenceRecipientSelection(correspondenceRecipient)) {
      return undefined;
    }

    if (correspondenceRecipient === "NONE") {
      return {
        clientCorrespondenceRecipient: null,
      };
    }

    const recipientName =
      correspondenceRecipient === CORRESPONDENCE_RECIPIENT_TYPE.PERSON
        ? personName
        : organisationName;

    return {
      clientCorrespondenceRecipient: new CorrespondenceRecipient(
        correspondenceRecipient,
        recipientName ?? "",
      ),
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
