import { strict as assert } from "assert";
import { AddPublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.js";

describe("AddPublicAuthorityUseCase", () => {
  it("returns technical failure when public authority option is missing", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(undefined);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns technical failure when public authority option is not in the list", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute("not-a-real-authority");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns the selected public authority as a single-item list", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute("cabinet-office");

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.deepEqual(
        result.data.selectedPublicAuthorities.map(
          (publicAuthority) => publicAuthority.publicAuthorityId,
        ),
        ["cabinet-office"],
      );
    }
  });

  it("returns multiple selected authorities as an array", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute([
      "cabinet-office",
      "attorney-generals-office",
    ]);

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.deepEqual(
        result.data.selectedPublicAuthorities.map(
          (publicAuthority) => publicAuthority.publicAuthorityId,
        ),
        ["cabinet-office", "attorney-generals-office"],
      );
    }
  });

  it("returns technical failure when an array contains an invalid authority", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(["cabinet-office", "not-real"]);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });
});
