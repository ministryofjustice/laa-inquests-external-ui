import type { GetPublicBodiesResponse } from "#src/adaptors/source/inquests-api/apply/GetPublicBodies/models/GetPublicBodies.types.js";

export interface GetPublicBodiesPort {
  getPublicBodies: (
    accessToken: string | undefined,
  ) => Promise<GetPublicBodiesResponse>;
}
