import type { Formatter } from "#src/utils/Formatter.js";
import type { SummaryListRow } from "#src/adaptors/presenters/apply/models/summaryList.types.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import { CORRESPONDENCE_ADDRESS_SOURCE } from "#src/infrastructure/locales/constants.js";

interface BuildCheckYourAnswersOutput {
  client: {
    clientFirstName: string;
    clientLastName: string;
    clientDob: string;
    clientAddress: string;
    clientCorrespondenceAddress: string;
    clientCorrespondenceRecipient: string;
  };
  deceasedDetails: {
    deceasedFirstName: string;
    deceasedLastName: string;
    dateOfDeath: string;
    deceasedClientRelationship: string;
    deceasedCoronerReference: string;
  };
  publicAuthorities: SummaryListRow[];
}

export class BuildCheckYourAnswersUseCase {
  formatter: Formatter;

  constructor(formatter: Formatter) {
    this.formatter = formatter;
  }

  execute(state: ConfirmationSessionState): BuildCheckYourAnswersOutput {
    const publicAuthorities = this.formatter.formatIntoTableRows(
      state.selectedPublicAuthorities ?? [],
    );

    const clientDob = this.#createDateString(
      state.clientDobDay,
      state.clientDobMonth,
      state.clientDobYear,
    );
    const dateOfDeath = this.#createDateString(
      state.deceasedDateOfDeathDay,
      state.deceasedDateOfDeathMonth,
      state.deceasedDateOfDeathYear,
    );

    const clientAddress = this.#getClientAddressSummary(state);
    const clientPostcode = this.#getClientPostcodeSummary(state);
    const clientCorrespondenceAddress =
      this.#getClientCorrespondenceAddressSummary(state);
    const clientCorrespondenceRecipient =
      this.#getClientCorrespondenceRecipientSummary(state);

    return {
      client: {
        clientFirstName: state.clientFirstName ?? "",
        clientLastName: state.clientLastName ?? "",
        clientDob,
        clientAddress: `${clientAddress} ${clientPostcode}`,
        clientCorrespondenceAddress,
        clientCorrespondenceRecipient,
      },
      deceasedDetails: {
        deceasedFirstName: state.deceasedFirstName ?? "",
        deceasedLastName: state.deceasedLastName ?? "",
        dateOfDeath,
        deceasedClientRelationship: state.deceasedClientRelationship ?? "",
        deceasedCoronerReference: state.deceasedCoronerReference ?? "",
      },
      publicAuthorities,
    };
  }

  #createDateString(day?: string, month?: string, year?: string): string {
    return typeof day === "string" &&
      typeof month === "string" &&
      typeof year === "string"
      ? `${day}/${month}/${year}`
      : "";
  }

  #createAddressString(
    addressLine1?: string,
    addressLine2?: string,
    townOrCity?: string,
    county?: string,
  ): string {
    return `${addressLine1 ?? ""}${addressLine2 ?? " "} ${townOrCity ?? ""} ${county ?? ""}`;
  }

  #getClientAddressSummary(state: ConfirmationSessionState): string {
    if (state.clientHasNoFixedAbode === true) {
      return "No fixed abode";
    }

    const { clientHomeAddress } = state;
    if (clientHomeAddress === null || clientHomeAddress === undefined) {
      return "";
    }

    return this.#createAddressString(
      clientHomeAddress.addressLine1,
      clientHomeAddress.addressLine2 ?? undefined,
      clientHomeAddress.townOrCity,
      clientHomeAddress.county ?? undefined,
    );
  }

  #getClientPostcodeSummary(state: ConfirmationSessionState): string {
    if (state.clientHasNoFixedAbode === true) {
      return "";
    }

    const { clientHomeAddress } = state;
    if (clientHomeAddress === null || clientHomeAddress === undefined) {
      return "";
    }

    return clientHomeAddress.postcode;
  }

  #getClientCorrespondenceAddressSummary(
    state: ConfirmationSessionState,
  ): string {
    const { clientCorrespondenceAddressSource: source } = state;

    if (source === CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS) {
      return "Same as client's home address";
    }

    if (source === CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS) {
      return "My office address";
    }

    const { clientCorrespondenceAddress: correspondenceAddress } = state;
    if (correspondenceAddress === null || correspondenceAddress === undefined) {
      return "";
    }

    const addressString = this.#createAddressString(
      correspondenceAddress.addressLine1,
      correspondenceAddress.addressLine2 ?? undefined,
      correspondenceAddress.townOrCity,
      correspondenceAddress.county ?? undefined,
    );

    return `${addressString} ${correspondenceAddress.postcode}`.trim();
  }

  #getClientCorrespondenceRecipientSummary(
    state: ConfirmationSessionState,
  ): string {
    return (
      state.clientCorrespondenceRecipient?.recipientName ??
      "Correspondence will be addressed to the client"
    );
  }
}
