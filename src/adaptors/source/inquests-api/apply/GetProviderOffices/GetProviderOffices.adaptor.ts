import type { AxiosInstance } from "axios";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import type { GetProviderOfficesResponse } from "./models/GetProviderOffices.types.js";
import { GetProviderOfficesResponseSchema } from "./models/GetProviderOffices.schema.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const OPERATION = "get_provider_offices";
const UPSTREAM_METHOD = "GET";
const UPSTREAM_ROUTE = "/applications/provider-offices/:firmId";

export class GetProviderOfficesAdaptor implements GetProviderOfficesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async getProviderOffices(
    firmId: string,
    accessToken: string | undefined,
  ): Promise<GetProviderOfficesResponse> {
    const startedAt = Date.now();

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response = await getFromInquestsApi<GetProviderOfficesResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/provider-offices/${firmId}`,
        accessToken,
      });

      const providerOffices = GetProviderOfficesResponseSchema.parse(
        response.data,
      );

      logger.logInfo({
        functionName: "get_provider_offices_adaptor",
        message: "Provider offices retrieved from upstream service",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });

      return providerOffices;
    } catch (error) {
      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "get_provider_offices_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
