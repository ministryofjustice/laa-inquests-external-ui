import type {
  ClientCorrespondenceAddressSourceError,
  ClientCorrespondenceRecipientError,
  ClientDetailsFormData,
  ClientHomeAddressError,
  ClientNameDobError,
  ClientNinoError,
  ClientPrevApplicationRefError,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import type { ClientDetailsValidator } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.js";

type ClientDetailsValidationErrors =
  | Partial<ClientNameDobError>
  | Partial<ClientNinoError>
  | Partial<ClientPrevApplicationRefError>
  | Partial<ClientHomeAddressError>
  | Partial<ClientCorrespondenceAddressSourceError>
  | Partial<ClientCorrespondenceRecipientError>;

type ClientDetailsValidationStep =
  | "NAME_DOB"
  | "NINO"
  | "PREV_APPLICATION_REFERENCE"
  | "HOME_ADDRESS"
  | "CORRESPONDENCE_ADDRESS_SOURCE"
  | "CORRESPONDENCE_ADDRESS"
  | "CORRESPONDENCE_RECIPIENT";

export interface ProcessClientDetailsJourneyInput {
  step: ClientDetailsValidationStep;
  formBody: Partial<ClientDetailsFormData>;
  hasNoFixedAbode?: boolean;
}

export interface ProcessClientDetailsJourneyOutput {
  errorSummaries: ClientDetailsValidationErrors;
}

export class ProcessClientDetailsJourneyUseCase {
  formValidator: ClientDetailsValidator;

  constructor(formValidator: ClientDetailsValidator) {
    this.formValidator = formValidator;
  }

  execute(
    input: ProcessClientDetailsJourneyInput,
  ): ProcessClientDetailsJourneyOutput {
    const { step, formBody, hasNoFixedAbode = false } = input;

    if (step === "NAME_DOB") {
      const nameErrors = this.formValidator.validateClientName(formBody);
      const dobErrors = this.formValidator.validateClientDob(formBody);
      const errorSummaries = {
        ...nameErrors,
        ...dobErrors,
      };
      return {
        errorSummaries,
      };
    }

    if (step === "NINO") {
      const errorSummaries = this.formValidator.validateNino(formBody);
      return {
        errorSummaries,
      };
    }

    if (step === "PREV_APPLICATION_REFERENCE") {
      const errorSummaries =
        this.formValidator.validatePrevApplicationReference(formBody);
      return {
        errorSummaries,
      };
    }

    if (step === "HOME_ADDRESS") {
      const errorSummaries = this.formValidator.validateHomeAddress(formBody);
      return {
        errorSummaries,
      };
    }

    if (step === "CORRESPONDENCE_ADDRESS_SOURCE") {
      const errorSummaries =
        this.formValidator.validateCorrespondenceAddressSource(
          formBody,
          hasNoFixedAbode,
        );
      return {
        errorSummaries,
      };
    }

    if (step === "CORRESPONDENCE_ADDRESS") {
      const errorSummaries =
        this.formValidator.validateCorrespondenceAddress(formBody);
      return {
        errorSummaries,
      };
    }

    const errorSummaries =
      this.formValidator.validateCorrespondenceRecipient(formBody);

    return {
      errorSummaries,
    };
  }
}
