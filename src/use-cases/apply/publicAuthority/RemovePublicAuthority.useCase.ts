import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import type { PublicAuthoritySessionState } from "#src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.js";

interface RemovePublicAuthorityOutput {
  selectedPublicAuthorities: PublicAuthority[];
  hasRemovedPublicAuthority: boolean;
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
          hasRemovedPublicAuthority: false,
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
        hasRemovedPublicAuthority: true,
      },
    };
  }
}
