import type { AxiosInstance } from "axios";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import type { GetProviderOfficesResponse } from "./models/GetProviderOffices.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export class GetProviderOfficesAdaptor implements GetProviderOfficesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async getProviderOffices(
    firmId: string,
    accessToken: string | undefined,
  ): Promise<GetProviderOfficesResponse> {
    try {
      const response = await getFromInquestsApi<GetProviderOfficesResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/provider-offices/${firmId}`,
        accessToken,
      });

      logger.logDebug({
        functionName: "getProviderOfficesAdaptor_getProviderOffices",
        message: "Provider offices retrieved from upstream service",
        extraContext: {
          event: "provider_offices_retrieval_completed",
          outcome: "SUCCESS",
        },
      });

      return response.data;
    } catch (err) {
      logger.logError({
        functionName: "getProviderOfficesAdaptor_getProviderOffices",
        message: "Provider offices request failed with exception",
        err,
        extraContext: {
          event: "provider_offices_retrieval_failed",
          reason: "UNEXPECTED_EXCEPTION",
        },
      });
      throw err;
    }
  }
}
