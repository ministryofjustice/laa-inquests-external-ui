import { strict as assert } from "assert";
import { ValidateOfficeAccountSelectionUseCase } from "#src/use-cases/apply/providerOffices/ValidateOfficeAccountSelection.useCase.js";
import { OFFICE_ACCOUNTS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("ValidateOfficeAccountSelectionUseCase", () => {
  it("returns validation failure when no office is selected", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute(undefined);

    assert.deepEqual(result, {
      status: "VALIDATION_FAILED",
      errorSummaries: {
        noOfficeSelected: { text: OFFICE_ACCOUNTS_ERROR.NO_OFFICE_SELECTED },
      },
    });
  });

  it("returns validation failure when the selected office is empty", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute("");

    assert.equal(result.status, "VALIDATION_FAILED");
  });

  it("returns success when an office is selected", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute("0A123A");

    assert.deepEqual(result, { status: "SUCCESS" });
  });
});
