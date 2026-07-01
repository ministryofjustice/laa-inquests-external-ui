import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import { CORRESPONDENCE_ADDRESS_SOURCE } from "#src/infrastructure/locales/constants.js";
import {
  getNullableStringValue,
  getStringValue,
} from "#src/utils/sessionValue.js";
import type { SessionData } from "express-session";

export class ConfirmationSessionStateMapper {
  map(session: Partial<SessionData>): ConfirmationSessionState {
    return {
      ...this.#mapClientState(session),
      ...this.#mapDeceasedState(session),
      firmCode: getStringValue(session.firmCode),
      officeId: getStringValue(session.officeId),
      coronersLetterId: getStringValue(session.coronersLetterId),
      coronersLetterFileName: getStringValue(session.coronersLetterFileName),
      providerEmail: getStringValue(session.providerEmail),
      selectedProceedings: Array.isArray(session.selectedProceedings)
        ? session.selectedProceedings
        : undefined,
      selectedPublicAuthorities: Array.isArray(
        session.selectedPublicAuthorities,
      )
        ? session.selectedPublicAuthorities
        : undefined,
    };
  }

  #mapClientState(session: Partial<SessionData>): ConfirmationSessionState {
    return {
      clientFirstName: getStringValue(session.clientFirstName),
      clientLastName: getStringValue(session.clientLastName),
      clientLastNameAtBirth: getNullableStringValue(
        session.clientLastNameAtBirth,
      ),
      clientDobDay: getStringValue(session.clientDobDay),
      clientDobMonth: getStringValue(session.clientDobMonth),
      clientDobYear: getStringValue(session.clientDobYear),
      clientNino: getNullableStringValue(session.clientNino),
      clientHomeAddress: session.clientHomeAddress,
      clientCorrespondenceAddress: session.clientCorrespondenceAddress,
      clientCorrespondenceAddressSource:
        this.#getClientCorrespondenceAddressSource(
          session.clientCorrespondenceAddressSource,
        ),
      clientCorrespondenceRecipient: this.#getClientCorrespondenceRecipient(
        session.clientCorrespondenceRecipient,
      ),
      clientHasNoFixedAbode: session.clientHasNoFixedAbode === true,
      prevLaaReferenceInput: getNullableStringValue(
        session.prevLaaReferenceInput,
      ),
    };
  }

  #mapDeceasedState(session: Partial<SessionData>): ConfirmationSessionState {
    return {
      deceasedFirstName: getStringValue(session.deceasedFirstName),
      deceasedLastName: getStringValue(session.deceasedLastName),
      deceasedDateOfBirthDay: getStringValue(session.deceasedDateOfBirthDay),
      deceasedDateOfBirthMonth: getStringValue(
        session.deceasedDateOfBirthMonth,
      ),
      deceasedDateOfBirthYear: getStringValue(session.deceasedDateOfBirthYear),
      deceasedDateOfDeathDay: getStringValue(session.deceasedDateOfDeathDay),
      deceasedDateOfDeathMonth: getStringValue(
        session.deceasedDateOfDeathMonth,
      ),
      deceasedDateOfDeathYear: getStringValue(session.deceasedDateOfDeathYear),
      deceasedClientRelationship: getStringValue(
        session.deceasedClientRelationship,
      ),
      deceasedCoronerReference: getStringValue(
        session.deceasedCoronerReference,
      ),
      deceasedFurtherInformation: getStringValue(
        session.deceasedFurtherInformation,
      ),
    };
  }

  #getClientCorrespondenceAddressSource(
    value: unknown,
  ): ConfirmationSessionState["clientCorrespondenceAddressSource"] {
    if (
      value === CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS ||
      value === CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS ||
      value === CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS
    ) {
      return value;
    }

    return undefined;
  }

  #getClientCorrespondenceRecipient(
    value: unknown,
  ): ConfirmationSessionState["clientCorrespondenceRecipient"] {
    if ((typeof value === "object" && value !== null) || value === null) {
      return value as ConfirmationSessionState["clientCorrespondenceRecipient"];
    }

    return undefined;
  }
}
