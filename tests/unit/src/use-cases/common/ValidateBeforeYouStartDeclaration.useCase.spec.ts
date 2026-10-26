import { strict as assert } from "assert";
import { BEFORE_YOU_START_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import { ValidateBeforeYouStartDeclarationUseCase } from "#src/use-cases/common/validateDeclaration/ValidateBeforeYouStartDeclaration.useCase.js";

describe("ValidateBeforeYouStartDeclarationUseCase", () => {
  it("returns validation failure when declaration is not confirmed", () => {
    const useCase = new ValidateBeforeYouStartDeclarationUseCase();

    const result = useCase.execute(undefined);

    assert.deepEqual(result, {
      status: "VALIDATION_FAILED",
      errorSummaries: {
        noDeclarationConfirmation: {
          text: BEFORE_YOU_START_DECLARATION_ERROR,
        },
      },
    });
  });

  it("returns success when declaration is true", () => {
    const useCase = new ValidateBeforeYouStartDeclarationUseCase();

    const result = useCase.execute("true");

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });
});
