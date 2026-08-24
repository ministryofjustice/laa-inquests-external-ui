import {
  CLAIM_EVIDENCE_ALLOWED_FILE_TYPES,
  CLAIM_EVIDENCE_ERROR,
  CLAIM_EVIDENCE_MAX_FILE_SIZE_BYTES,
  CLAIM_EVIDENCE_TOO_SMALL_FILE_SIZE_BYTES,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import { validateUploadedFile } from "#src/adaptors/presenters/claim/common/fileUploadValidator.utils.js";

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

    const errorText = validateUploadedFile(fileInput, {
      allowedFileTypes: CLAIM_EVIDENCE_ALLOWED_FILE_TYPES,
      maxFileSizeBytes: CLAIM_EVIDENCE_MAX_FILE_SIZE_BYTES,
      emptyFileSizeBytes: CLAIM_EVIDENCE_TOO_SMALL_FILE_SIZE_BYTES,
      invalidFileTypeMessage: CLAIM_EVIDENCE_ERROR.INVALID_FILE_TYPE,
      fileTooLargeMessage: CLAIM_EVIDENCE_ERROR.FILE_TOO_LARGE,
      fileIsEmptyMessage: CLAIM_EVIDENCE_ERROR.FILE_IS_EMPTY,
    });
    return errorText === undefined
      ? {}
      : { evidenceError: { text: errorText } };
  }
}
