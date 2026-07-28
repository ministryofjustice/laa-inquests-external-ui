import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";

export interface PublicAuthorityError {
  noPublicAuthoritySelected?: { text: string };
}

export interface PublicAuthorityFormData {
  publicAuthorityOption?: string | string[];
}

export const PUBLIC_AUTHORITY_ERROR = {
  NO_SELECTION: "Please select at least one public authority",
};

export class PublicAuthorityValidator extends FormValidator {
  validatePublicAuthorityInput(
    formBody: Partial<PublicAuthorityFormData>,
  ): Partial<PublicAuthorityError> {
    const errorSummaries: Partial<PublicAuthorityError> = {};

    const { publicAuthorityOption } = formBody;

    const selectedOptions = Array.isArray(publicAuthorityOption)
      ? publicAuthorityOption
      : typeof publicAuthorityOption === "string"
        ? [publicAuthorityOption]
        : [];

    if (selectedOptions.length === EMPTY_ARR_LENGTH) {
      errorSummaries.noPublicAuthoritySelected = {
        text: PUBLIC_AUTHORITY_ERROR.NO_SELECTION,
      };
    }

    return errorSummaries;
  }
}
