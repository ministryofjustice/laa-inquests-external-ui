import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import type { SearchCasesResponse } from "#src/adaptors/source/inquests-api/claim/SearchCases/models/SearchCases.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export class SearchCasesUseCase {
  constructor(private readonly searchCasesPort: SearchCasesPort) {}

  async execute(
    laaReference: string,
    accessToken: string | undefined,
    meritsDecision?: string,
  ): Promise<UseCaseResult<SearchCasesResponse>> {
    try {
      const cases = await this.searchCasesPort.searchCases(
        { laaReference, meritsDecision },
        accessToken,
      );
      return { status: "SUCCESS", data: cases };
    } catch (err) {
      logger.logError({
        functionName: "searchCasesUseCase_execute",
        message: "Case search failed with exception",
        err,
        extraContext: {
          event: "claim_case_search_failed",
          reason: "UNEXPECTED_EXCEPTION",
          laa_reference: laaReference,
          merits_decision: meritsDecision,
        },
      });
      return { status: "TECHNICAL_FAILURE", reason: "UNEXPECTED_EXCEPTION" };
    }
  }
}
