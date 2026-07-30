import {
  CLAIM_EVIDENCE_ALLOWED_FILE_TYPES,
  CLAIM_EVIDENCE_ERROR,
  CLAIM_EVIDENCE_MAX_FILE_SIZE_BYTES,
  CLAIM_EVIDENCE_TOO_SMALL_FILE_SIZE_BYTES,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";

export interface UploadEvidenceError {
  evidenceError?: { text: string };
}

export class UploadEvidenceValidator extends FormValidator {
  validateEvidenceSelection(
    evidenceFiles: Array<{ id: string; fileName: string }> | undefined,
  ): Partial<UploadEvidenceError> {
    if (
      !Array.isArray(evidenceFiles) ||
      evidenceFiles.length === EMPTY_ARR_LENGTH
    ) {
      return {
        evidenceError: {
          text: CLAIM_EVIDENCE_ERROR.MINIMUM_ONE_FILE_REQUIRED,
        },
      };
    }

    return {};
  }

  validateEvidenceUploadFile(
    fileInput: Express.Multer.File | undefined,
  ): Partial<UploadEvidenceError> {
    if (fileInput === undefined) {
      return {
        evidenceError: { text: CLAIM_EVIDENCE_ERROR.NO_FILE_CHOSEN },
      };
    }

    const errorText = this.#validateFile(fileInput);
    return errorText === undefined
      ? {}
      : { evidenceError: { text: errorText } };
  }

  #validateFile(fileInput: Express.Multer.File): string | undefined {
    if (!CLAIM_EVIDENCE_ALLOWED_FILE_TYPES.includes(fileInput.mimetype)) {
      return CLAIM_EVIDENCE_ERROR.INVALID_FILE_TYPE;
    }
    if (fileInput.size > CLAIM_EVIDENCE_MAX_FILE_SIZE_BYTES) {
      return CLAIM_EVIDENCE_ERROR.FILE_TOO_LARGE;
    }
    if (fileInput.size === CLAIM_EVIDENCE_TOO_SMALL_FILE_SIZE_BYTES) {
      return CLAIM_EVIDENCE_ERROR.FILE_IS_EMPTY;
    }
  }
}
