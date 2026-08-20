import type { AxiosInstance } from "axios";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type {
  SearchCasesRequest,
  SearchCasesResponse,
} from "./models/SearchCases.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export class SearchCasesAdaptor implements SearchCasesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async searchCases(
    params: SearchCasesRequest,
    accessToken: string | undefined,
  ): Promise<SearchCasesResponse> {
    const { laaReference, meritsDecision } = params;
    const queryParams: Record<string, string> = {
      laa_reference: laaReference,
    };

    if (meritsDecision !== undefined) {
      queryParams.merits_decision = meritsDecision;
    }

    try {
      const response = await getFromInquestsApi<SearchCasesResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: "/applications/search",
        params: queryParams,
        accessToken,
      });
      logger.logInfo({
        functionName: "searchCasesAdaptor_searchCases",
        message: "Case search returned response payload",
        extraContext: {
          event: "claim_case_search_completed",
          outcome: "SUCCESS",
          merits_decision_supplied: meritsDecision !== undefined,
          params: queryParams,
        },
      });
      return response.data;
    } catch (err) {
      logger.logError({
        functionName: "searchCasesAdaptor_searchCases",
        message: "Case search request failed with exception",
        err,
        extraContext: {
          event: "claim_case_search_failed",
          reason: "UNEXPECTED_EXCEPTION",
          merits_decision_supplied: meritsDecision !== undefined,
          params: queryParams,
        },
      });
      throw err;
    }
  }
}
