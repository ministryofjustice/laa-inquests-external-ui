import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type { SearchCasesResponse } from "#src/adaptors/source/inquests-api/claim/SearchCases/models/SearchCases.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class SearchCasesUseCase {
  constructor(private readonly searchCasesPort: SearchCasesPort) {}

  async execute(
    laaReference: string,
  ): Promise<UseCaseResult<SearchCasesResponse>> {
    try {
      const cases = await this.searchCasesPort.searchCases({ laaReference });
      return { status: "SUCCESS", data: cases };
    } catch {
      return { status: "TECHNICAL_FAILURE", reason: "UNEXPECTED_EXCEPTION" };
    }
  }
}
