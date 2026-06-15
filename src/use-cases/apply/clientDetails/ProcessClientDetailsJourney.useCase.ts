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

interface ProcessClientDetailsJourneyInput {
  step: ClientDetailsValidationStep;
  formBody: Partial<ClientDetailsFormData>;
  hasNoFixedAbode?: boolean;
}

interface ProcessClientDetailsJourneyOutput {
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
      return {
        errorSummaries: {
          ...nameErrors,
          ...dobErrors,
        },
      };
    }

    if (step === "NINO") {
      return {
        errorSummaries: this.formValidator.validateNino(formBody),
      };
    }

    if (step === "PREV_APPLICATION_REFERENCE") {
      return {
        errorSummaries:
          this.formValidator.validatePrevApplicationReference(formBody),
      };
    }

    if (step === "HOME_ADDRESS") {
      return {
        errorSummaries: this.formValidator.validateHomeAddress(formBody),
      };
    }

    if (step === "CORRESPONDENCE_ADDRESS_SOURCE") {
      return {
        errorSummaries: this.formValidator.validateCorrespondenceAddressSource(
          formBody,
          hasNoFixedAbode,
        ),
      };
    }

    if (step === "CORRESPONDENCE_ADDRESS") {
      return {
        errorSummaries:
          this.formValidator.validateCorrespondenceAddress(formBody),
      };
    }

    return {
      errorSummaries:
        this.formValidator.validateCorrespondenceRecipient(formBody),
    };
  }
}
