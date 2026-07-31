import type { GetPublicAuthoritiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicAuthorities/models/GetPublicAuthorities.types.js";

export interface GetPublicAuthoritiesPort {
  getPublicAuthorities: (
    accessToken: string | undefined,
  ) => Promise<GetPublicAuthoritiesResponse>;
}
