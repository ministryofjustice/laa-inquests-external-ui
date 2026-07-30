import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

interface AddPublicAuthorityOutput {
  selectedPublicAuthorities: PublicAuthority[];
}

export class AddPublicAuthorityUseCase {
  execute(
    publicAuthorityOptions: string | string[] | undefined,
    availablePublicAuthorities: PublicAuthority[],
  ): UseCaseResult<AddPublicAuthorityOutput> {
    const selectedOptions = Array.isArray(publicAuthorityOptions)
      ? publicAuthorityOptions
      : typeof publicAuthorityOptions === "string"
        ? [publicAuthorityOptions]
        : [];

    if (selectedOptions.length === EMPTY_ARR_LENGTH) {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    const selectedPublicAuthorities = selectedOptions
      .map((optionId) =>
        availablePublicAuthorities.find(
          (option) => option.publicAuthorityId === optionId,
        ),
      )
      .filter((option): option is PublicAuthority => option !== undefined);

    if (selectedPublicAuthorities.length !== selectedOptions.length) {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    return {
      status: "SUCCESS",
      data: {
        selectedPublicAuthorities,
      },
    };
  }
}
