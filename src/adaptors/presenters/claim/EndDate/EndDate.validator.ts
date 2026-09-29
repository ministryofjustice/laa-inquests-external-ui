import { END_DATE_ERROR } from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";

export interface EndDateFormData {
  "end-date-day": string;
  "end-date-month": string;
  "end-date-year": string;
}

export interface EndDateError {
  endDateInputError: { text: string };
}

export class EndDateValidator extends FormValidator {
  validateEndDate(formBody: Partial<EndDateFormData>): Partial<EndDateError> {
    const errorSummaries: Partial<EndDateError> = {};

    const {
      "end-date-day": day,
      "end-date-month": month,
      "end-date-year": year,
    } = formBody;

    const errorMessage = this.validateDateInput(day, month, year, {
      missing: END_DATE_ERROR.MISSING_END_DATE,
      nonNumeric: END_DATE_ERROR.NON_NUMERIC_END_DATE,
      invalidDate: END_DATE_ERROR.INVALID_END_DATE,
      futureDate: END_DATE_ERROR.FUTURE_END_DATE,
    });

    if (typeof errorMessage === "string") {
      errorSummaries.endDateInputError = { text: errorMessage };
      return errorSummaries;
    }

    return errorSummaries;
  }
}
