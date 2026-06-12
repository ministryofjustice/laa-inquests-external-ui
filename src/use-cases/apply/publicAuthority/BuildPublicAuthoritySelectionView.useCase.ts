import { PUBLIC_AUTHORITY_OPTIONS } from "#src/infrastructure/locales/constants.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { PublicAuthoritySessionState } from "#src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.js";

export interface BuildPublicAuthoritySelectionViewOutput {
  availablePublicAuthorities: PublicAuthority[];
  selectedPublicAuthorities: PublicAuthority[];
}

export class BuildPublicAuthoritySelectionViewUseCase {
  execute(
    state: PublicAuthoritySessionState,
  ): BuildPublicAuthoritySelectionViewOutput {
    const selectedPublicAuthorities = state.selectedPublicAuthorities ?? [];
    const availablePublicAuthorities = PUBLIC_AUTHORITY_OPTIONS.filter(
      (option) =>
        !selectedPublicAuthorities.some(
          (selected) => selected.publicAuthorityId === option.publicAuthorityId,
        ),
    );

    return {
      availablePublicAuthorities,
      selectedPublicAuthorities,
    };
  }
}
