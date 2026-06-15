import { strict as assert } from "assert";
import { ValidateClientDeclarationUseCase } from "#src/use-cases/apply/confirmation/ValidateClientDeclaration.useCase.js";
import { CLIENT_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";

describe("ValidateClientDeclarationUseCase", () => {
  it("returns validation failure when declaration is not confirmed", () => {
    const useCase = new ValidateClientDeclarationUseCase();

    const result = useCase.execute(undefined);

    assert.deepEqual(result, {
      status: "VALIDATION_FAILED",
      errorSummaries: {
        noDeclarationConfirmation: {
          text: CLIENT_DECLARATION_ERROR.NO_CONFIRMATION,
        },
      },
    });
  });

  it("returns success when declaration is confirmed in checkbox array", () => {
    const useCase = new ValidateClientDeclarationUseCase();

    const result = useCase.execute(["false", "true"]);

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("returns success when declaration is true", () => {
    const useCase = new ValidateClientDeclarationUseCase();

    const result = useCase.execute("true");

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });
});
