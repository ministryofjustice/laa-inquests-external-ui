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
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

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
    logger.logInfo({
      functionName: "processClientDetailsJourneyUseCase_execute",
      message: "Client details validation step started",
      extraContext: {
        event: "apply_client_details_validation_step_started",
        step,
      },
    });

    if (step === "NAME_DOB") {
      const nameErrors = this.formValidator.validateClientName(formBody);
      const dobErrors = this.formValidator.validateClientDob(formBody);
      const errorSummaries = {
        ...nameErrors,
        ...dobErrors,
      };
      this.#logValidationOutcome(step, errorSummaries);
      return {
        errorSummaries,
      };
    }

    if (step === "NINO") {
      const errorSummaries = this.formValidator.validateNino(formBody);
      this.#logValidationOutcome(step, errorSummaries);
      return {
        errorSummaries,
      };
    }

    if (step === "PREV_APPLICATION_REFERENCE") {
      const errorSummaries =
        this.formValidator.validatePrevApplicationReference(formBody);
      this.#logValidationOutcome(step, errorSummaries);
      return {
        errorSummaries,
      };
    }

    if (step === "HOME_ADDRESS") {
      const errorSummaries = this.formValidator.validateHomeAddress(formBody);
      this.#logValidationOutcome(step, errorSummaries);
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
      this.#logValidationOutcome(step, errorSummaries);
      return {
        errorSummaries,
      };
    }

    if (step === "CORRESPONDENCE_ADDRESS") {
      const errorSummaries =
        this.formValidator.validateCorrespondenceAddress(formBody);
      this.#logValidationOutcome(step, errorSummaries);
      return {
        errorSummaries,
      };
    }

    const errorSummaries =
      this.formValidator.validateCorrespondenceRecipient(formBody);
    this.#logValidationOutcome(step, errorSummaries);

    return {
      errorSummaries,
    };
  }

  #logValidationOutcome(
    step: ClientDetailsValidationStep,
    errorSummaries: ClientDetailsValidationErrors,
  ): void {
    const { length: errorCount } = Object.keys(errorSummaries);

    if (errorCount > EMPTY_ARR_LENGTH) {
      logger.logInfo({
        functionName: "processClientDetailsJourneyUseCase_execute",
        message: "Client details validation failed",
        extraContext: {
          event: "apply_client_details_validation_failed",
          step,
          error_count: errorCount,
        },
      });
    } else {
      logger.logDebug({
        functionName: "processClientDetailsJourneyUseCase_execute",
        message: "Client details validation passed",
        extraContext: {
          event: "apply_client_details_validation_passed",
          step,
        },
      });
    }
  }
}
