import { BEFORE_YOU_START_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import type { BeforeYouStartDeclarationError } from "#src/use-cases/common/validateDeclaration/models/validateBeforeYouStartDeclaration.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class ValidateBeforeYouStartDeclarationUseCase {
  execute(
    declarationConfirmation?: string,
  ): UseCaseResult<undefined, BeforeYouStartDeclarationError> {
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
