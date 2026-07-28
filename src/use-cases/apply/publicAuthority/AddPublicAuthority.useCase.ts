import { PUBLIC_AUTHORITY_OPTIONS } from "#src/infrastructure/locales/constants.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

interface AddPublicAuthorityOutput {
  selectedPublicAuthority: PublicAuthority;
  selectedPublicAuthorities: PublicAuthority[];
}

export class AddPublicAuthorityUseCase {
  execute(
    publicAuthorityOption: string | undefined,
  ): UseCaseResult<AddPublicAuthorityOutput> {
    if (typeof publicAuthorityOption !== "string") {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    const selectedPublicAuthority = PUBLIC_AUTHORITY_OPTIONS.find(
      (option) => option.publicAuthorityId === publicAuthorityOption,
    );

    if (selectedPublicAuthority === undefined) {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    return {
      status: "SUCCESS",
      data: {
        selectedPublicAuthority,
        selectedPublicAuthorities: [selectedPublicAuthority],
      },
    };
  }
}
