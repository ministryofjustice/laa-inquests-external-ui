import type { ListClaimsResponse } from "#src/adaptors/source/inquests-api/claim/ListClaims/models/ListClaims.types.js";

export interface ListClaimsPort {
  listClaims: (
    laaReference: string,
    assessed: boolean,
    accessToken: string | undefined,
  ) => Promise<ListClaimsResponse>;
}
