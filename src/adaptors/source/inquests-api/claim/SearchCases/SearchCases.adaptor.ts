import type { AxiosInstance } from "axios";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type {
  SearchCasesRequest,
  SearchCasesResponse,
} from "./models/SearchCases.types.js";

export class SearchCasesAdaptor implements SearchCasesPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async searchCases(params: SearchCasesRequest): Promise<SearchCasesResponse> {
    const response = await this.http.get<SearchCasesResponse>(
      `${this.baseUrl}/applications/search`,
      { params: { laa_reference: params.laaReference } },
    );
    return response.data;
  }
}
