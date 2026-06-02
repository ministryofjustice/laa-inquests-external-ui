import type { PublicAuthority } from "#src/domain/publicAuthority/PublicAuthority.js";

export class PublicAuthoritySelection {
  static filterAvailable(
    selectedPublicAuthorities: PublicAuthority[],
    allPublicAuthorities: PublicAuthority[],
  ): PublicAuthority[] {
    return allPublicAuthorities.filter(
      (option) =>
        !selectedPublicAuthorities.some(
          (selected) => selected.publicAuthorityId === option.publicAuthorityId,
        ),
    );
  }
}

