import { CLIENT_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import type { ClientDeclarationError } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class ValidateClientDeclarationUseCase {
  execute(
    declarationConfirmation?: string | string[],
  ): UseCaseResult<undefined, ClientDeclarationError> {
    const hasConfirmedDeclaration =
      declarationConfirmation === "true" ||
      (Array.isArray(declarationConfirmation) &&
        declarationConfirmation.includes("true"));

    if (!hasConfirmedDeclaration) {
      return {
        status: "VALIDATION_FAILED",
        errorSummaries: {
          noDeclarationConfirmation: {
            text: CLIENT_DECLARATION_ERROR.NO_CONFIRMATION,
          },
        },
      };
    }

    return {
      status: "SUCCESS",
    };
  }
}
