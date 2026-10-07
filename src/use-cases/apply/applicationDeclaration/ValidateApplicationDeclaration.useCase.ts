import { APPLICATION_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import type { ApplicationDeclarationError } from "#src/adaptors/source/inquests-api/apply/ApplicationDeclaration/models/ApplicationDeclaration.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class ValidateApplicationDeclarationUseCase {
  execute(
    declarationConfirmation?: string,
  ): UseCaseResult<undefined, ApplicationDeclarationError> {
    const hasConfirmedDeclaration = declarationConfirmation === "true";

    if (!hasConfirmedDeclaration) {
      return {
        status: "VALIDATION_FAILED",
        errorSummaries: {
          noDeclarationConfirmation: {
            text: APPLICATION_DECLARATION_ERROR,
          },
        },
      };
    }

    return {
      status: "SUCCESS",
    };
  }
}
