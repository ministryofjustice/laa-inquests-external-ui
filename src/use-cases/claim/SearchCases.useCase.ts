import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type { SearchCasesResponse } from "#src/adaptors/source/inquests-api/claim/SearchCases/models/SearchCases.types.js";

export class SearchCasesUseCase {
  constructor(private readonly searchCasesPort: SearchCasesPort) {}

  async execute(
    laaReference: string,
    accessToken: string | undefined,
    meritsDecision?: string,
  ): Promise<SearchCasesResponse> {
    return await this.searchCasesPort.searchCases(
      { laaReference, meritsDecision },
      accessToken,
    );
  }
}
