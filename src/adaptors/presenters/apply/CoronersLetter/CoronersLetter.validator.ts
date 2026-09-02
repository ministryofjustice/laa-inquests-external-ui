import type { UploadCoronersLetterError } from "#src/adaptors/presenters/apply/models/form.types.js";
import {
  CORONERS_LETTER_ALLOWED_FILE_TYPES,
  CORONERS_LETTER_ERROR,
  CORONERS_LETTER_MAX_FILE_SIZE_BYTES,
  CORONERS_LETTER_TOO_SMALL_FILE_SIZE_BYTES,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";

export class UploadCoronersLetterValidator extends FormValidator {
  validateCoronersLetterSelection(
    coronersLetterId: string | undefined,
  ): Partial<UploadCoronersLetterError> {
    if (coronersLetterId === undefined || coronersLetterId === "") {
      return {
        coronersLetterError: { text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
      };
    }

    return {};
  }

  validateCoronersLetterUploadFile(
    fileInput: Express.Multer.File | undefined,
    existingCoronersLetterId?: string,
  ): Partial<UploadCoronersLetterError> {
    if (fileInput === undefined) {
      return {
        coronersLetterError: { text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
      };
    }

    if (existingCoronersLetterId !== undefined && existingCoronersLetterId !== "") {
      return {
        coronersLetterError: {
          text: CORONERS_LETTER_ERROR.ONLY_ONE_FILE_ALLOWED,
        },
      };
    }

    const errorText = this.#validateFile(fileInput);
    return errorText === undefined
      ? {}
      : { coronersLetterError: { text: errorText } };
  }

  #validateFile(fileInput: Express.Multer.File): string | undefined {
    if (!CORONERS_LETTER_ALLOWED_FILE_TYPES.includes(fileInput.mimetype)) {
      return CORONERS_LETTER_ERROR.INVALID_FILE_TYPE;
    }
    if (fileInput.size > CORONERS_LETTER_MAX_FILE_SIZE_BYTES) {
      return CORONERS_LETTER_ERROR.FILE_TOO_LARGE;
    }
    if (fileInput.size === CORONERS_LETTER_TOO_SMALL_FILE_SIZE_BYTES) {
      return CORONERS_LETTER_ERROR.FILE_IS_EMPTY;
    }
  }
}
