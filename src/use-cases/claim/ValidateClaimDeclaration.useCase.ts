import { BEFORE_YOU_START_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import type { ClaimDeclarationError } from "#src/adaptors/source/inquests-api/claim/ClaimDeclaration/models/ClaimDeclaration.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class ValidateClaimDeclarationUseCase {
  execute(
    declarationConfirmation?: string,
  ): UseCaseResult<undefined, ClaimDeclarationError> {
    const hasConfirmedDeclaration = declarationConfirmation === "true";

    if (!hasConfirmedDeclaration) {
      return {
        status: "VALIDATION_FAILED",
        errorSummaries: {
          noDeclarationConfirmation: {
            text: BEFORE_YOU_START_DECLARATION_ERROR,
          },
        },
      };
    }

    return {
      status: "SUCCESS",
    };
  }
}
