import moment from "moment";
import {
  DATE_MONTH_INDEX_OFFSET,
  MAX_CHARACTER_LENGTH,
  MINIMUM_DATE_PART_VALUE,
} from "#src/infrastructure/locales/constants.js";
import {
  isPartyName,
  isWordsText,
  normaliseFreeText,
} from "#src/utils/textRules.js";

export interface DateParts {
  day?: string;
  month?: string;
  year?: string;
}

export interface TextInputMessages {
  missing: string;
  invalidCharacters: string;
  exceedsMaxLength: string;
}

export class FormValidator {
  protected exceedsMaxLength(
    inputValue: string | undefined,
    maxLength: number,
  ): boolean {
    return typeof inputValue === "string" && inputValue.length > maxLength;
  }

  /**
   * Checks a text input made of words (a person's name, a relationship) the way the API does:
   * trimmed, then required, then limited to letters, spaces, hyphens and apostrophes, then
   * capped in length. Returns the first failure.
   */
  protected validateWordsInput(
    value: string | undefined,
    messages: TextInputMessages,
    maxLength = MAX_CHARACTER_LENGTH,
  ): { text: string } | undefined {
    return this.validateTextInput(value, isWordsText, messages, maxLength);
  }

  /**
   * The same checks for the name of a person or organisation on a letter (the paying party,
   * a "care of" recipient): letters, numbers, spaces and a little punctuation.
   */
  protected validatePartyNameInput(
    value: string | undefined,
    messages: TextInputMessages,
    maxLength = MAX_CHARACTER_LENGTH,
  ): { text: string } | undefined {
    return this.validateTextInput(value, isPartyName, messages, maxLength);
  }

  private validateTextInput(
    value: string | undefined,
    isAllowed: (text: string) => boolean,
    messages: TextInputMessages,
    maxLength: number,
  ): { text: string } | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const text = normaliseFreeText(value);

    if (text === "") {
      return { text: messages.missing };
    }

    if (!isAllowed(text)) {
      return { text: messages.invalidCharacters };
    }

    if (text.length > maxLength) {
      return { text: messages.exceedsMaxLength };
    }

    return undefined;
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
    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(year);

    return moment([
      yearNum,
      monthNum - DATE_MONTH_INDEX_OFFSET,
      dayNum,
    ]).isValid();
  }

  protected checkDatePartsArePositive(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    return (
      Number(day) > MINIMUM_DATE_PART_VALUE &&
      Number(month) > MINIMUM_DATE_PART_VALUE &&
      Number(year) > MINIMUM_DATE_PART_VALUE
    );
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

    if (!this.checkDatePartsArePositive(day, month, year)) {
      return errors.invalidDate;
    }

    if (!this.checkDateIsValid(day, month, year)) {
      return errors.invalidDate;
    }

    const date = moment([
      Number(year),
      Number(month) - DATE_MONTH_INDEX_OFFSET,
      Number(day),
    ]);
    if (date.toDate() > new Date()) {
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

  protected isDateStrictlyAfter(first: DateParts, second: DateParts): boolean {
    const bothDatesValid =
      !this.checkDateFieldsAreEmpty(first.day, first.month, first.year) &&
      !this.checkDateIsNotANumber(first.day, first.month, first.year) &&
      this.checkDateIsValid(first.day, first.month, first.year) &&
      !this.checkDateFieldsAreEmpty(second.day, second.month, second.year) &&
      !this.checkDateIsNotANumber(second.day, second.month, second.year) &&
      this.checkDateIsValid(second.day, second.month, second.year);

    if (!bothDatesValid) {
      return false;
    }

    const firstDate = moment([
      Number(first.year),
      Number(first.month) - DATE_MONTH_INDEX_OFFSET,
      Number(first.day),
    ]);
    const secondDate = moment([
      Number(second.year),
      Number(second.month) - DATE_MONTH_INDEX_OFFSET,
      Number(second.day),
    ]);

    return firstDate.isAfter(secondDate, "day");
  }
}
