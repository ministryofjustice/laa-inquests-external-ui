import type {
  SearchCasesRequest,
  SearchCasesResponse,
} from "#src/adaptors/source/inquests-api/claim/SearchCases/models/SearchCases.types.js";

export interface SearchCasesPort {
  searchCases: (params: SearchCasesRequest) => Promise<SearchCasesResponse>;
}
