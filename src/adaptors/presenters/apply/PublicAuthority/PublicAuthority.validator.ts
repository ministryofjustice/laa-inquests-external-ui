import { FormValidator } from "#src/utils/FormValidator.js";

export interface PublicAuthorityError {
  noPublicAuthoritySelected?: { text: string };
  noConfirmationSelected?: { text: string };
}

export interface PublicAuthorityFormData {
  publicAuthorityOption?: string;
  "add-another-public-authority"?: string;
}

export const PUBLIC_AUTHORITY_ERROR = {
  NO_SELECTION: "Please select a public authority",
  NO_CONFIRMATION: "Please select either yes or no to continue.",
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

  validateAddAnotherPublicAuthority(
    formBody: Partial<PublicAuthorityFormData>,
  ): Partial<PublicAuthorityError> {
    const errorSummaries: Partial<PublicAuthorityError> = {};

    const { "add-another-public-authority": isAddingAnotherPublicAuthority } =
      formBody;

    if (typeof isAddingAnotherPublicAuthority !== "string") {
      errorSummaries.noConfirmationSelected = {
        text: PUBLIC_AUTHORITY_ERROR.NO_CONFIRMATION,
      };
    }

    return errorSummaries;
  }
}
