import { strict as assert } from "assert";
import { AddPublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.js";

const AVAILABLE_PUBLIC_AUTHORITIES = [
  {
    publicAuthorityId: "Cabinet Office",
    publicAuthorityDescription: "Cabinet Office",
  },
  {
    publicAuthorityId: "Attorney General's Office",
    publicAuthorityDescription: "Attorney General's Office",
  },
];

describe("AddPublicAuthorityUseCase", () => {
  it("returns technical failure when public authority option is missing", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(undefined, AVAILABLE_PUBLIC_AUTHORITIES);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns technical failure when public authority option is not in the list", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(
      "not-a-real-authority",
      AVAILABLE_PUBLIC_AUTHORITIES,
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns the selected public authority as a single-item list", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(
      "Cabinet Office",
      AVAILABLE_PUBLIC_AUTHORITIES,
    );

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.deepEqual(
        result.data.selectedPublicAuthorities.map(
          (publicAuthority) => publicAuthority.publicAuthorityId,
        ),
        ["Cabinet Office"],
      );
    }
  });

  it("returns multiple selected authorities as an array", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(
      ["Cabinet Office", "Attorney General's Office"],
      AVAILABLE_PUBLIC_AUTHORITIES,
    );

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.deepEqual(
        result.data.selectedPublicAuthorities.map(
          (publicAuthority) => publicAuthority.publicAuthorityId,
        ),
        ["Cabinet Office", "Attorney General's Office"],
      );
    }
  });

  it("returns technical failure when an array contains an invalid authority", () => {
    const useCase = new AddPublicAuthorityUseCase();

    const result = useCase.execute(
      ["Cabinet Office", "not-real"],
      AVAILABLE_PUBLIC_AUTHORITIES,
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });
});
