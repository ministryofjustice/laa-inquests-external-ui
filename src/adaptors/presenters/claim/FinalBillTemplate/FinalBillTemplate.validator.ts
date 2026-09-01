import {
  CLAIM_FINAL_BILL_TEMPLATE_ALLOWED_FILE_TYPES,
  CLAIM_FINAL_BILL_TEMPLATE_ERROR,
  CLAIM_FINAL_BILL_TEMPLATE_MAX_FILE_SIZE_BYTES,
  CLAIM_FINAL_BILL_TEMPLATE_TOO_SMALL_FILE_SIZE_BYTES,
} from "#src/infrastructure/locales/constants.js";
import type { ClaimFinalBillCostTemplate } from "#src/infrastructure/express/session/index.types.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import { validateUploadedFile } from "#src/adaptors/presenters/claim/common/fileUploadValidator.utils.js";

export interface FinalBillTemplateError {
  templateError?: { text: string };
}

export class FinalBillTemplateValidator extends FormValidator {
  validateTemplateSelection(
    finalBillCostTemplate: ClaimFinalBillCostTemplate | undefined,
  ): Partial<FinalBillTemplateError> {
    if (finalBillCostTemplate === undefined) {
      return {
        templateError: { text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_REQUIRED },
      };
    }

    return {};
  }

  validateTemplateUploadFile(
    fileInput: Express.Multer.File | undefined,
    existingTemplate?: ClaimFinalBillCostTemplate,
  ): Partial<FinalBillTemplateError> {
    if (fileInput === undefined) {
      return {
        templateError: { text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.NO_FILE_CHOSEN },
      };
    }

    if (existingTemplate !== undefined) {
      return {
        templateError: {
          text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.ONLY_ONE_FILE_ALLOWED,
        },
      };
    }

    const errorText = validateUploadedFile(fileInput, {
      allowedFileTypes: CLAIM_FINAL_BILL_TEMPLATE_ALLOWED_FILE_TYPES,
      maxFileSizeBytes: CLAIM_FINAL_BILL_TEMPLATE_MAX_FILE_SIZE_BYTES,
      emptyFileSizeBytes: CLAIM_FINAL_BILL_TEMPLATE_TOO_SMALL_FILE_SIZE_BYTES,
      invalidFileTypeMessage: CLAIM_FINAL_BILL_TEMPLATE_ERROR.INVALID_FILE_TYPE,
      fileTooLargeMessage: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_TOO_LARGE,
      fileIsEmptyMessage: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_IS_EMPTY,
    });
    return errorText === undefined
      ? {}
      : { templateError: { text: errorText } };
  }
}
