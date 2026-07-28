import { FormValidator } from "#src/utils/FormValidator.js";

export interface PublicAuthorityError {
  noPublicAuthoritySelected?: { text: string };
}

export interface PublicAuthorityFormData {
  publicAuthorityOption?: string;
}

export const PUBLIC_AUTHORITY_ERROR = {
  NO_SELECTION: "Please select a public authority",
};

export class PublicAuthorityValidator extends FormValidator {
  validatePublicAuthorityInput(
    formBody: Partial<PublicAuthorityFormData>,
  ): Partial<PublicAuthorityError> {
    const errorSummaries: Partial<PublicAuthorityError> = {};

    const { publicAuthorityOption } = formBody;

    if (typeof publicAuthorityOption !== "string") {
      errorSummaries.noPublicAuthoritySelected = {
        text: PUBLIC_AUTHORITY_ERROR.NO_SELECTION,
      };
    }

    return errorSummaries;
  }
}
