import { FormValidator } from "#src/utils/FormValidator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export interface PublicAuthorityError {
  noPublicAuthoritySelected?: { text: string };
  noConfirmationSelected?: { text: string };
  noPublicAuthoritiesInList?: { text: string };
}

export interface PublicAuthorityFormData {
  publicAuthorityOption?: string;
  "add-another-public-authority"?: string;
}

export interface RemovePublicAuthorityFormData {
  publicAuthorityId: string;
  "remove-public-authority": string;
}

export const PUBLIC_AUTHORITY_ERROR = {
  NO_SELECTION: "Please select a public authority",
  NO_CONFIRMATION: "Please select either yes or no to continue.",
  NO_PUBLIC_AUTHORITIES_IN_LIST:
    "A case must have a minimum of 1 interested party",
};

export class PublicAuthorityValidator extends FormValidator {
  // # TODO Step 3: Move this to application/apply/publicAuthority/validators/PublicAuthorityValidator.
  validatePublicAuthorityInput(
    formBody: Partial<PublicAuthorityFormData>,
  ): Partial<PublicAuthorityError> {
    // # TODO Step 3: Move this to application/apply/publicAuthority/validators/selectionPolicy.
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
    // # TODO Step 3: Move this to application/apply/publicAuthority/validators/addAnotherPolicy.
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

  validatePublicAuthorityList(
    selectedPublicAuthorities: unknown[],
  ): Partial<PublicAuthorityError> {
    // # TODO Step 1: Move this to domain/publicAuthority/PublicAuthoritySelection.ts minimum-size invariant.
    const errorSummaries: Partial<PublicAuthorityError> = {};

    if (selectedPublicAuthorities.length === EMPTY_ARR_LENGTH) {
      errorSummaries.noPublicAuthoritiesInList = {
        text: PUBLIC_AUTHORITY_ERROR.NO_PUBLIC_AUTHORITIES_IN_LIST,
      };
    }

    return errorSummaries;
  }
}
