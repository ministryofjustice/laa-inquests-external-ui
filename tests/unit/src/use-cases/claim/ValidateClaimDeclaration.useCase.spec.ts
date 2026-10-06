import { strict as assert } from "assert";
import { CLAIM_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import { ValidateClaimDeclarationUseCase } from "#src/use-cases/claim/ValidateClaimDeclaration.useCase.js";

describe("ValidateClaimDeclarationUseCase", () => {
  it("returns validation failure when declaration is not confirmed", () => {
    const useCase = new ValidateClaimDeclarationUseCase();

    const result = useCase.execute(undefined);

    assert.deepEqual(result, {
      status: "VALIDATION_FAILED",
      errorSummaries: {
        noDeclarationConfirmation: {
          text: CLAIM_DECLARATION_ERROR,
        },
      },
    });
  });

  it("returns success when declaration is confirmed in checkbox array", () => {
    const useCase = new ValidateClaimDeclarationUseCase();

    const result = useCase.execute(["false", "true"]);

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("returns success when declaration is true", () => {
    const useCase = new ValidateClaimDeclarationUseCase();

    const result = useCase.execute("true");

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });
});
