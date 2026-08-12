import type { AxiosInstance } from "axios";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type {
  SearchCasesRequest,
  SearchCasesResponse,
} from "./models/SearchCases.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

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

    const response = await getFromInquestsApi<SearchCasesResponse>({
      http: this.http,
      baseUrl: this.baseUrl,
      path: "/applications/search",
      params: queryParams,
      accessToken,
    });
    return response.data;
  }
}
