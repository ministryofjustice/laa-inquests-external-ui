import type { AxiosInstance } from "axios";
import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import type { GetPublicAuthoritiesResponse } from "./models/GetPublicAuthorities.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

export class GetPublicAuthoritiesAdaptor implements GetPublicAuthoritiesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async getPublicAuthorities(
    accessToken: string | undefined,
  ): Promise<GetPublicAuthoritiesResponse> {
    const response = await getFromInquestsApi<GetPublicAuthoritiesResponse>({
      http: this.http,
      baseUrl: this.baseUrl,
      path: "/applications/public-bodies",
      accessToken,
    });

    return response.data;
  }
}
