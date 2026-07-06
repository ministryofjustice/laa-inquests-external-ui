import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import {
  SubmitApplicationRequestSchema,
  SubmitApplicationResponseSchema,
} from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
  HTTP_CREATED,
} from "#src/infrastructure/locales/constants.js";

interface SubmitApplicationSuccess {
  laaReference: number;
}

type SubmitBodyResult =
  | {
      status: "SUCCESS";
      data: SubmitApplicationRequest;
    }
  | {
      status: "TECHNICAL_FAILURE";
      reason: "INVALID_INPUT_STATE" | "UNEXPECTED_EXCEPTION";
    };

export class SubmitApplicationUseCase {
  applySubmitPort: ApplySubmitPort;

  constructor(applySubmitPort: ApplySubmitPort) {
    this.applySubmitPort = applySubmitPort;
  }

  async execute(
    state: ConfirmationSessionState,
  ): Promise<UseCaseResult<SubmitApplicationSuccess>> {
    const submitBodyResult = this.#generateSubmitBody(state);

    if (submitBodyResult.status === "TECHNICAL_FAILURE") {
      return submitBodyResult;
    }

    try {
      const responseRaw = await this.applySubmitPort.submitApplication(
        submitBodyResult.data,
        state.accessToken,
      );
      const parseResponseResult =
        SubmitApplicationResponseSchema.safeParse(responseRaw);

      if (!parseResponseResult.success) {
        return {
          status: "TECHNICAL_FAILURE",
          reason: "INVALID_RESPONSE",
        };
      }

      const { data: responseData } = parseResponseResult;
      const { statusCode, laaReference } = responseData;

      if (statusCode === HTTP_CREATED) {
        return {
          status: "SUCCESS",
          data: {
            laaReference,
          },
        };
      }

      return {
        status: "TECHNICAL_FAILURE",
        reason: "UPSTREAM_REJECTED",
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }

  #generateSubmitBody(state: ConfirmationSessionState): SubmitBodyResult {
    try {
      const client = this.#buildClientForSubmit(state);
      this.#applyOptionalClientFields(client, state);
      this.#applyClientAddressesForSubmit(client, state);
      this.#applyClientCorrespondenceRecipientForSubmit(client, state);

      const submitBodyWithDetails = {
        client,
        deceased: this.#buildDeceasedForSubmit(state),
        proceedings: this.#buildProceedingsForSubmit(state),
        publicBodies: this.#buildPublicBodiesForSubmit(state),
        provider: {
          firmCode: state.firmCode!,
          officeId: state.officeId!,
          emailAddress: state.providerEmail!,
        },
        coronersLetterId: state.coronersLetterId!,
      };

      const parseRequestResult = SubmitApplicationRequestSchema.safeParse(
        submitBodyWithDetails,
      );

      if (!parseRequestResult.success) {
        return {
          status: "TECHNICAL_FAILURE",
          reason: "INVALID_INPUT_STATE",
        };
      }

      return {
        status: "SUCCESS",
        data: parseRequestResult.data,
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
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

    client.isClientCorrespondenceRecipient =
      clientCorrespondenceRecipient === null;

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
      dateOfBirth: formatDateDDMMYYYY(
        state.clientDobYear,
        state.clientDobMonth,
        state.clientDobDay,
      ),
      hasNoFixedAbode: false,
      correspondenceAddressSource:
        CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
      homeAddress: null,
      correspondenceAddress: null,
      isClientCorrespondenceRecipient: true,
    };
  }

  #buildDeceasedForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["deceased"] {
    return {
      deceasedFirstName: state.deceasedFirstName!,
      deceasedLastName: state.deceasedLastName!,
      deceasedDateOfBirth: formatDateDDMMYYYY(
        state.deceasedDateOfBirthYear,
        state.deceasedDateOfBirthMonth,
        state.deceasedDateOfBirthDay,
      ),
      deceasedDateOfDeath: formatDateDDMMYYYY(
        state.deceasedDateOfDeathYear,
        state.deceasedDateOfDeathMonth,
        state.deceasedDateOfDeathDay,
      ),
      coronersReference: state.deceasedCoronerReference ?? "",
      furtherInformation: state.deceasedFurtherInformation ?? "",
      clientRelationshipToDeceased: state.deceasedClientRelationship ?? "",
    };
  }

  #buildProceedingsForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["proceedings"] {
    const selectedProceedings = state.selectedProceedings ?? [];
    return selectedProceedings.map((proceeding: Proceeding) => ({
      proceedingId: proceeding.proceedingId,
    }));
  }

  #buildPublicBodiesForSubmit(
    state: ConfirmationSessionState,
  ): SubmitApplicationRequest["publicBodies"] {
    return (
      state.selectedPublicAuthorities?.map((body) => ({
        publicBodyId: body.publicAuthorityDescription,
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
