import { MAX_CHARACTER_LENGTH } from "#src/infrastructure/locales/constants.js";

export class FormValidator {
  protected validateFormInputValue(
    inputValue: string | undefined,
    checkIsEmpty = true,
  ): boolean {
    return checkIsEmpty
      ? typeof inputValue === "string" && inputValue === ""
      : typeof inputValue === "string" &&
          inputValue.length > MAX_CHARACTER_LENGTH;
  }
  protected checkDobFieldsAreEmpty(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    const isDayEmpty = this.validateFormInputValue(day, true);
    const isMonthEmpty = this.validateFormInputValue(month, true);
    const isYearEmpty = this.validateFormInputValue(year, true);

    return isDayEmpty || isMonthEmpty || isYearEmpty;
  }
  protected checkDobIsNotANumber(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    const isDayNaN = isNaN(parseInt(day ?? "", 10));
    const isMonthNaN = isNaN(parseInt(month ?? "", 10));
    const isYearNaN = isNaN(parseInt(year ?? "", 10));
    return isDayNaN || isMonthNaN || isYearNaN;
  }
}
