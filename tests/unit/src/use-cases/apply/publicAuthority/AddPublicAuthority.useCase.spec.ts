import { strict as assert } from "assert";
import { AddPublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.js";

describe("AddPublicAuthorityUseCase", () => {
  it("returns technical failure when public authority option is missing", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(undefined, {
      selectedPublicAuthorities: [],
    });

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("adds selected public authority to the top of the selected list", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute("cabinet-office", {
      selectedPublicAuthorities: [
        {
          publicAuthorityId: "attorney-generals-office",
          publicAuthorityDescription: "Attorney General's Office",
        },
      ],
    });

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.equal(
        result.data.selectedPublicAuthority.publicAuthorityId,
        "cabinet-office",
      );
      assert.deepEqual(
        result.data.selectedPublicAuthorities.map(
          (publicAuthority) => publicAuthority.publicAuthorityId,
        ),
        ["cabinet-office", "attorney-generals-office"],
      );
    }
  });
});
