import { OFFICE_ACCOUNTS_ERROR } from "#src/infrastructure/locales/constants.js";
import type { OfficeAccountsError } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";

export class ValidateOfficeAccountSelectionUseCase {
  execute(
    selectedOffice: string | undefined,
    authorisedOfficeCodes: string[],
  ): UseCaseResult<undefined, OfficeAccountsError> {
    if (
      typeof selectedOffice !== "string" ||
      !authorisedOfficeCodes.includes(selectedOffice)
    ) {
      return {
        status: "VALIDATION_FAILED",
        errorSummaries: {
          noOfficeSelected: { text: OFFICE_ACCOUNTS_ERROR.NO_OFFICE_SELECTED },
        },
      };
    }

    return { status: "SUCCESS" };
  }
}
