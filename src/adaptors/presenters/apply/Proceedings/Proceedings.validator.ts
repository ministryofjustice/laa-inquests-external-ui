import {
  PROCEEDING_ERROR,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import type {
  ProceedingsError,
  ProceedingsFormData,
} from "../models/form.types.js";

export class ProceedingsValidator extends FormValidator {
  // # TODO Step 3: Move this to application/apply/proceedings/validators/ProceedingsValidator.
  validateProceedingInput(
    formBody: Partial<ProceedingsFormData>,
  ): Partial<ProceedingsError> {
    // # TODO Step 3: Move this to application/apply/proceedings/validators/proceedingInputPolicy.
    const errorSummaries: Partial<ProceedingsError> = {};

    const { "proceeding-option": proceedingOption } = formBody;

    if (typeof proceedingOption !== "string") {
      errorSummaries.noProceedingSelected = {
        text: PROCEEDING_ERROR.NO_PROCEEDING_SPECIFIED,
      };
    }

    return errorSummaries;
  }

  validateAddAnotherProceeding(
    formBody: Partial<ProceedingsFormData>,
  ): Partial<ProceedingsError> {
    // # TODO Step 3: Move this to application/apply/proceedings/validators/addAnotherPolicy.
    const errorSummaries: Partial<ProceedingsError> = {};

    const { "add-another-proceeding": isAddingAnotherProceeding } = formBody;

    if (typeof isAddingAnotherProceeding !== "string") {
      errorSummaries.noConfirmationSelected = {
        text: PROCEEDING_ERROR.NO_CONFIRMATION_SPECIFIED,
      };
    }
    return errorSummaries;
  }

  validateProceedingList(
    selectedProceedings: unknown[],
  ): Partial<ProceedingsError> {
    // # TODO Step 1: Move this to domain/proceedings/ProceedingsSelection.ts minimum-size invariant.
    const errorSummaries: Partial<ProceedingsError> = {};

    if (selectedProceedings.length === EMPTY_ARR_LENGTH) {
      errorSummaries.noProceedingsInList = {
        text: PROCEEDING_ERROR.NO_PROCEEDINGS_IN_LIST,
      };
    }

    return errorSummaries;
  }
}
