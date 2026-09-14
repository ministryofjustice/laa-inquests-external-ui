import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import { SubmitApplicationRequestSchema } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import { formatDateISOYYYYMMDD } from "#src/utils/dateFormatter.js";
import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
} from "#src/infrastructure/locales/constants.js";

interface SubmitApplicationSuccess {
  laaReference: string;
}

export class SubmitApplicationUseCase {
  applySubmitPort: ApplySubmitPort;

  constructor(applySubmitPort: ApplySubmitPort) {
    this.applySubmitPort = applySubmitPort;
  }

  async execute(
    state: ConfirmationSessionState,
  ): Promise<SubmitApplicationSuccess> {
    const body = this.#generateSubmitBody(state);
    return await this.applySubmitPort.submitApplication(
      body,
      state.accessToken,
    );
  }

  #generateSubmitBody(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest {
    const client = this.#buildClientForSubmit(state);

    this.#applyOptionalClientFields(client, state);
    this.#applyClientAddressesForSubmit(client, state);
    this.#applyClientCorrespondenceRecipientForSubmit(client, state);

    const submitBodyWithDetails = {
      client,
      deceased: this.#buildDeceasedForSubmit(state),
      proceeding: this.#buildProceedingForSubmit(state),
      publicBodies: this.#buildPublicBodiesForSubmit(state),
      provider: {
        officeId: state.officeId!,
        emailAddress: state.providerEmail!,
      },
      coronersLetterId: state.coronersLetterId!,
    };

    return SubmitApplicationRequestSchema.parse(submitBodyWithDetails);
  }

  #applyOptionalClientFields(
    client: SubmitApplicationRequest["client"],
    state: ConfirmationSessionState,
  ): void {
    const { clientLastNameAtBirth, clientNino } = state;

    if (typeof clientLastNameAtBirth === "string") {
      client.clientLastNameAtBirth = clientLastNameAtBirth;
    }

    if (typeof clientNino === "string") {
      client.nationalInsuranceNumber = clientNino;
    }
  }

  #applyClientAddressesForSubmit(
    client: SubmitApplicationRequest["client"],
    state: ConfirmationSessionState,
  ): void {
    const hasNoFixedAbode = state.clientHasNoFixedAbode === true;
    client.hasNoFixedAbode = hasNoFixedAbode;

    const correspondenceAddressSource =
      state.clientCorrespondenceAddressSource ??
      CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS;
    client.correspondenceAddressSource = correspondenceAddressSource;

    const clientCorrespondenceAddress =
      this.#getClientCorrespondenceAddress(state);
    if (
      correspondenceAddressSource ===
        CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS &&
      clientCorrespondenceAddress !== null
    ) {
      client.correspondenceAddress = {
        addressLine1: clientCorrespondenceAddress.addressLine1,
        addressLine2: clientCorrespondenceAddress.addressLine2 ?? null,
        townOrCity: clientCorrespondenceAddress.townOrCity,
        county: clientCorrespondenceAddress.county ?? null,
        postcode: clientCorrespondenceAddress.postcode,
      };
    }

    const clientHomeAddress = this.#getClientHomeAddress(state);
    if (!hasNoFixedAbode && clientHomeAddress !== null) {
      client.homeAddress = {
        addressLine1: clientHomeAddress.addressLine1,
        addressLine2: clientHomeAddress.addressLine2 ?? null,
        townOrCity: clientHomeAddress.townOrCity,
        county: clientHomeAddress.county ?? null,
        postcode: clientHomeAddress.postcode,
      };
    }
  }

  #applyClientCorrespondenceRecipientForSubmit(
    client: SubmitApplicationRequest["client"],
    state: ConfirmationSessionState,
  ): void {
    const clientCorrespondenceRecipient =
      this.#getClientCorrespondenceRecipient(state);

    if (clientCorrespondenceRecipient === null) {
      delete client.correspondenceRecipient;
    } else {
      client.correspondenceRecipient = {
        recipientType: clientCorrespondenceRecipient.recipientType,
        recipientName: clientCorrespondenceRecipient.recipientName,
      };
    }
  }

  #buildClientForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["client"] {
    return {
      clientFirstName: state.clientFirstName!,
      clientLastName: state.clientLastName!,
      dateOfBirth: formatDateISOYYYYMMDD(
        state.clientDobYear,
        state.clientDobMonth,
        state.clientDobDay,
      ),
      hasNoFixedAbode: false,
      correspondenceAddressSource:
        CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
      homeAddress: null,
      correspondenceAddress: null,
    };
  }

  #buildDeceasedForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["deceased"] {
    return {
      deceasedFirstName: state.deceasedFirstName!,
      deceasedLastName: state.deceasedLastName!,
      deceasedDateOfBirth: formatDateISOYYYYMMDD(
        state.deceasedDateOfBirthYear,
        state.deceasedDateOfBirthMonth,
        state.deceasedDateOfBirthDay,
      ),
      deceasedDateOfDeath: formatDateISOYYYYMMDD(
        state.deceasedDateOfDeathYear,
        state.deceasedDateOfDeathMonth,
        state.deceasedDateOfDeathDay,
      ),
      coronersReference: state.deceasedCoronerReference ?? "",
      furtherInformation: state.deceasedFurtherInformation ?? "",
      clientRelationshipToDeceased: state.deceasedClientRelationship ?? "",
    };
  }

  #buildProceedingForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["proceeding"] {
    const { selectedProceeding } = state;
    return {
      proceedingId: selectedProceeding!.proceedingId,
    };
  }

  #buildPublicBodiesForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["publicBodies"] {
    return (
      state.selectedPublicAuthorities?.map((body) => ({
        publicBodyId: body.publicAuthorityId,
      })) ?? []
    );
  }

  #getClientHomeAddress(state: ConfirmationSessionState): Address | null {
    const { clientHomeAddress } = state;
    return this.#isClientHomeAddress(clientHomeAddress)
      ? clientHomeAddress
      : null;
  }

  #getClientCorrespondenceAddress(
    state: ConfirmationSessionState,
  ): Address | null {
    const { clientCorrespondenceAddress } = state;
    return this.#isClientHomeAddress(clientCorrespondenceAddress)
      ? clientCorrespondenceAddress
      : null;
  }

  #getClientCorrespondenceRecipient(
    state: ConfirmationSessionState,
  ): CorrespondenceRecipient | null {
    const { clientCorrespondenceRecipient } = state;
    return this.#isClientCorrespondenceRecipient(clientCorrespondenceRecipient)
      ? clientCorrespondenceRecipient
      : null;
  }

  #isClientHomeAddress(value: unknown): value is Address {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const candidate = value as Partial<Address>;
    return (
      typeof candidate.addressLine1 === "string" &&
      typeof candidate.townOrCity === "string" &&
      typeof candidate.postcode === "string"
    );
  }

  #isClientCorrespondenceRecipient(
    value: unknown,
  ): value is CorrespondenceRecipient {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const candidate = value as Partial<CorrespondenceRecipient>;
    return (
      (candidate.recipientType === CORRESPONDENCE_RECIPIENT_TYPE.PERSON ||
        candidate.recipientType ===
          CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION) &&
      typeof candidate.recipientName === "string"
    );
  }
}
