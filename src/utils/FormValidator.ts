import moment from "moment";
import {
  DATE_MONTH_INDEX_OFFSET,
  MAX_CHARACTER_LENGTH,
} from "#src/infrastructure/locales/constants.js";

export class FormValidator {
  protected exceedsMaxLength(
    inputValue: string | undefined,
    maxLength: number,
  ): boolean {
    return typeof inputValue === "string" && inputValue.length > maxLength;
  }

  protected validateFormInputValue(
    inputValue: string | undefined,
    checkIsEmpty = true,
  ): boolean {
    return checkIsEmpty
      ? typeof inputValue === "string" && inputValue === ""
      : this.exceedsMaxLength(inputValue, MAX_CHARACTER_LENGTH);
  }
  protected checkDateFieldsAreEmpty(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    const isDayEmpty = this.validateFormInputValue(day, true);
    const isMonthEmpty = this.validateFormInputValue(month, true);
    const isYearEmpty = this.validateFormInputValue(year, true);

    return isDayEmpty || isMonthEmpty || isYearEmpty;
  }
  protected checkDateIsNotANumber(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    const isDayNaN = isNaN(parseInt(day ?? "", 10));
    const isMonthNaN = isNaN(parseInt(month ?? "", 10));
    const isYearNaN = isNaN(parseInt(year ?? "", 10));
    return isDayNaN || isMonthNaN || isYearNaN;
  }

  protected checkDateIsValid(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    return moment(`${year}-${month}-${day}`).isValid();
  }

  protected validateDateInput(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
    errors: {
      missing: string;
      nonNumeric: string;
      invalidDate: string;
      futureDate: string;
    },
  ): string | undefined {
    if (this.checkDateFieldsAreEmpty(day, month, year)) {
      return errors.missing;
    }

    if (this.checkDateIsNotANumber(day, month, year)) {
      return errors.nonNumeric;
    }

    if (!this.checkDateIsValid(day, month, year)) {
      return errors.invalidDate;
    }

    const date = new Date(
      Number(year),
      Number(month) - DATE_MONTH_INDEX_OFFSET,
      Number(day),
    );
    if (date > new Date()) {
      return errors.futureDate;
    }

    return undefined;
  }

  protected validateMinMaxLength(
    inputValue: string | undefined,
    minLength: number,
    maxLength: number,
  ): boolean {
    return (
      typeof inputValue === "string" &&
      (inputValue.length < minLength || inputValue.length > maxLength)
    );
  }
}
