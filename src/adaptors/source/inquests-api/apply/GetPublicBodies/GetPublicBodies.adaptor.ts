import type { AxiosInstance } from "axios";
import type { GetPublicBodiesPort } from "#src/ports/source/inquests-api/GetPublicBodies.port.js";
import type { GetPublicBodiesResponse } from "./models/GetPublicBodies.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

export class GetPublicBodiesAdaptor implements GetPublicBodiesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async getPublicBodies(
    accessToken: string | undefined,
  ): Promise<GetPublicBodiesResponse> {
    const response = await getFromInquestsApi<GetPublicBodiesResponse>({
      http: this.http,
      baseUrl: this.baseUrl,
      path: "/applications/public-bodies",
      accessToken,
    });

    return response.data;
  }
}
