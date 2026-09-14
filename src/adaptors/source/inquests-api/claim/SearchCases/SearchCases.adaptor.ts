import type { AxiosInstance } from "axios";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type {
  SearchCasesRequest,
  SearchCasesResponse,
} from "./models/SearchCases.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { SearchCasesResponseSchema } from "./models/SearchCases.schema.js";

const OPERATION = "search_cases";
const UPSTREAM_METHOD = "GET";
const UPSTREAM_ROUTE = "/applications/search";

export class SearchCasesAdaptor implements SearchCasesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async searchCases(
    params: SearchCasesRequest,
    accessToken: string | undefined,
  ): Promise<SearchCasesResponse> {
    const startedAt = Date.now();
    const { laaReference, meritsDecision } = params;
    const queryParams: Record<string, string> = {
      laa_reference: laaReference,
    };

    if (meritsDecision !== undefined) {
      queryParams.merits_decision = meritsDecision;
    }

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response = await getFromInquestsApi<SearchCasesResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: UPSTREAM_ROUTE,
        params: queryParams,
        accessToken,
      });

      const cases = SearchCasesResponseSchema.parse(response.data);

      logger.logInfo({
        functionName: "search_cases_adaptor",
        message: "Case search returned response payload",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
          merits_decision_supplied: meritsDecision !== undefined,
        },
      });

      return cases;
    } catch (error) {
      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "search_cases_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
