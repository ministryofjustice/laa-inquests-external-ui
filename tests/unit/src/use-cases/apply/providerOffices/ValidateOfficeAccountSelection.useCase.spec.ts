import { strict as assert } from "assert";
import { ValidateOfficeAccountSelectionUseCase } from "#src/use-cases/apply/providerOffices/ValidateOfficeAccountSelection.useCase.js";
import { OFFICE_ACCOUNTS_ERROR } from "#src/infrastructure/locales/constants.js";

const AUTHORISED_OFFICES = ["0A123A", "0A456A"];

describe("ValidateOfficeAccountSelectionUseCase", () => {
  it("returns validation failure when no office is selected", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute(undefined, AUTHORISED_OFFICES);

    assert.deepEqual(result, {
      status: "VALIDATION_FAILED",
      errorSummaries: {
        noOfficeSelected: { text: OFFICE_ACCOUNTS_ERROR.NO_OFFICE_SELECTED },
      },
    });
  });

  it("returns validation failure when the selected office is empty", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute("", AUTHORISED_OFFICES);

    assert.equal(result.status, "VALIDATION_FAILED");
  });

  it("returns validation failure when the selected office is not one the user has access to", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute("0A999Z", AUTHORISED_OFFICES);

    assert.deepEqual(result, {
      status: "VALIDATION_FAILED",
      errorSummaries: {
        noOfficeSelected: { text: OFFICE_ACCOUNTS_ERROR.NO_OFFICE_SELECTED },
      },
    });
  });

  it("returns success when an authorised office is selected", () => {
    const useCase = new ValidateOfficeAccountSelectionUseCase();

    const result = useCase.execute("0A123A", AUTHORISED_OFFICES);

    assert.deepEqual(result, { status: "SUCCESS" });
  });
});
