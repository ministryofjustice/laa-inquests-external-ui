import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import type { PublicAuthoritySessionState } from "#src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.js";

interface RemovePublicAuthorityOutput {
  selectedPublicAuthorities: PublicAuthority[];
  successMessage?: string;
}

export class RemovePublicAuthorityUseCase {
  execute(
    publicAuthorityId: string,
    removePublicAuthority: string,
    state: PublicAuthoritySessionState,
  ): UseCaseResult<RemovePublicAuthorityOutput> {
    if (removePublicAuthority !== "true") {
      return {
        status: "SUCCESS",
        data: {
          selectedPublicAuthorities: state.selectedPublicAuthorities ?? [],
        },
      };
    }

    return {
      status: "SUCCESS",
      data: {
        selectedPublicAuthorities: (
          state.selectedPublicAuthorities ?? []
        ).filter(
          (publicAuthority) =>
            publicAuthority.publicAuthorityId !== publicAuthorityId,
        ),
        successMessage: "Public authority has been removed",
      },
    };
  }
}
