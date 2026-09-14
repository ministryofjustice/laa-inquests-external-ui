import type { AxiosInstance } from "axios";
import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";
import type { GetPublicAuthoritiesResponse } from "./models/GetPublicAuthorities.types.js";
import { GetPublicAuthoritiesResponseSchema } from "./models/GetPublicAuthorities.schema.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const OPERATION = "get_public_bodies";
const UPSTREAM_METHOD = "GET";
const UPSTREAM_ROUTE = "/applications/public-bodies";

export class GetPublicAuthoritiesAdaptor implements GetPublicAuthoritiesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async getPublicAuthorities(
    accessToken: string | undefined,
  ): Promise<GetPublicAuthoritiesResponse> {
    const startedAt = Date.now();

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response = await getFromInquestsApi<GetPublicAuthoritiesResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: UPSTREAM_ROUTE,
        accessToken,
      });

      const publicAuthorities = GetPublicAuthoritiesResponseSchema.parse(
        response.data,
      );

      logger.logInfo({
        functionName: "get_public_authorities_adaptor",
        message: "Public authorities retrieved from upstream service",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });

      return publicAuthorities;
    } catch (error) {
      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "get_public_authorities_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
