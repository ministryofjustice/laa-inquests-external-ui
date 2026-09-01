import { FormValidator } from "#src/utils/FormValidator.js";
import { RECOVERY_COST_ERROR } from "#src/infrastructure/locales/constants.js";

export interface RecoveryCostMadeError {
  recoveryCostMadeInputError?: { text: string };
}

export interface RecoveryCostMadeFormData {
  "recovery-cost-made"?: string;
}

export class RecoveryCostMadeValidator extends FormValidator {
  validateRecoveryCostMade(
    formBody: Partial<RecoveryCostMadeFormData>,
  ): Partial<RecoveryCostMadeError> {
    const errorSummaries: Partial<RecoveryCostMadeError> = {};
    const { "recovery-cost-made": recoveryCostMade } = formBody;

    if (typeof recoveryCostMade !== "string") {
      errorSummaries.recoveryCostMadeInputError = {
        text: RECOVERY_COST_ERROR.MISSING_SELECTION,
      };
    }

    return errorSummaries;
  }
}
