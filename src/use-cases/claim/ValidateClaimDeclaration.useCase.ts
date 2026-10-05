import { CLAIM_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import type { ClaimDeclarationError } from "#src/adaptors/source/inquests-api/claim/ClaimDeclaration/models/ClaimDeclaration.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class ValidateClaimDeclarationUseCase {
  execute(
    declarationConfirmation?: string | string[],
  ): UseCaseResult<undefined, ClaimDeclarationError> {
    const hasConfirmedDeclaration =
      declarationConfirmation === "true" ||
      (Array.isArray(declarationConfirmation) &&
        declarationConfirmation.includes("true"));

    if (!hasConfirmedDeclaration) {
      return {
        status: "VALIDATION_FAILED",
        errorSummaries: {
          noDeclarationConfirmation: {
            text: CLAIM_DECLARATION_ERROR,
          },
        },
      };
    }

    return {
      status: "SUCCESS",
    };
  }
}
