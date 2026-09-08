import type { GetProviderOfficesResponse } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/models/GetProviderOffices.types.js";

export interface GetProviderOfficesPort {
  getProviderOffices: (
    firmId: string,
    accessToken: string | undefined,
  ) => Promise<GetProviderOfficesResponse>;
}
