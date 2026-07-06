import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";

export interface PublicAuthoritySessionState {
  selectedPublicAuthorities?: PublicAuthority[];
}
