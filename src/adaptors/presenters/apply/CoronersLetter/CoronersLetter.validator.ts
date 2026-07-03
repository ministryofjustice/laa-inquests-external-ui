import type { UploadCoronersLetterError } from "#src/adaptors/presenters/apply/models/form.types.js";
import {
  CORONERS_LETTER_ALLOWED_FILE_TYPES,
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
  CORONERS_LETTER_TOO_SMALL_FILE_SIZE_BYTES,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";

export class UploadCoronersLetterValidator extends FormValidator {
  validateCoronersLetterUploadFile(
    fileInput: Express.Multer.File | undefined,
  ): Partial<UploadCoronersLetterError> {
    const errorSummaries: Partial<UploadCoronersLetterError> = {};

    if (fileInput === undefined) {
      errorSummaries.coronersLetterError = {
        text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
      };
    } else if (!this.#isFileTypeValid(fileInput)) {
      errorSummaries.coronersLetterError = {
        text: CORONERS_LETTER_ERROR.INVALID_FILE_TYPE,
      };
    } else if (this.#isFileTooLarge(fileInput)) {
      errorSummaries.coronersLetterError = {
        text: CORONERS_LETTER_ERROR.FILE_TOO_LARGE,
      };
    } else if (this.#isFileTooSmall(fileInput)) {
      errorSummaries.coronersLetterError = {
        text: CORONERS_LETTER_ERROR.FILE_TOO_SMALL,
      };
    }

    return errorSummaries;
  }

  #isFileTooLarge(fileInput: Express.Multer.File): boolean {
    return fileInput.size > CORONERS_LETTER_MAX_FILE_SIZE_BYTES;
  }

  #isFileTooSmall(fileInput: Express.Multer.File): boolean {
    return fileInput.size === CORONERS_LETTER_TOO_SMALL_FILE_SIZE_BYTES;
  }

  #isFileTypeValid(fileInput: Express.Multer.File): boolean {
    return CORONERS_LETTER_ALLOWED_FILE_TYPES.includes(fileInput.mimetype);
  }
}
