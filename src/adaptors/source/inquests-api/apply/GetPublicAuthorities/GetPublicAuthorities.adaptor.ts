import type { AxiosInstance } from "axios";
import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import type { GetPublicAuthoritiesResponse } from "./models/GetPublicAuthorities.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export class GetPublicAuthoritiesAdaptor implements GetPublicAuthoritiesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async getPublicAuthorities(
    accessToken: string | undefined,
  ): Promise<GetPublicAuthoritiesResponse> {
    try {
      const response = await getFromInquestsApi<GetPublicAuthoritiesResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: "/applications/public-bodies",
        accessToken,
      });

      logger.logDebug({
        functionName: "getPublicAuthoritiesAdaptor_getPublicAuthorities",
        message: "Public authorities retrieved from upstream service",
        extraContext: {
          event: "public_authorities_retrieval_completed",
          outcome: "SUCCESS",
        },
      });

      return response.data;
    } catch (err) {
      logger.logError({
        functionName: "getPublicAuthoritiesAdaptor_getPublicAuthorities",
        message: "Public authorities request failed with exception",
        err,
        extraContext: {
          event: "public_authorities_retrieval_failed",
          reason: "UNEXPECTED_EXCEPTION",
        },
      });
      throw err;
    }
  }
}
