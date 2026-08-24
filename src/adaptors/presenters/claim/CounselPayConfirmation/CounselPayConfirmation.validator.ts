import { FormValidator } from "#src/utils/FormValidator.js";
import { COUNSEL_PAY_CONFIRMATION_ERROR } from "#src/infrastructure/locales/constants.js";

export interface CounselPayConfirmationError {
  counselPayConfirmationInputError?: { text: string };
}

export interface CounselPayConfirmationFormData {
  "counsel-bills-paid"?: string;
}

export class CounselPayConfirmationValidator extends FormValidator {
  validateConfirmation(
    formBody: Partial<CounselPayConfirmationFormData>,
  ): Partial<CounselPayConfirmationError> {
    const errorSummaries: Partial<CounselPayConfirmationError> = {};
    const { "counsel-bills-paid": counselBillsPaid } = formBody;

    if (counselBillsPaid !== "true") {
      errorSummaries.counselPayConfirmationInputError = {
        text: COUNSEL_PAY_CONFIRMATION_ERROR.MISSING_CONFIRMATION,
      };
    }

    return errorSummaries;
  }
}
