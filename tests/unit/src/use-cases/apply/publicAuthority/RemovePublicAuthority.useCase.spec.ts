import { strict as assert } from "assert";
import { RemovePublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/RemovePublicAuthority.useCase.js";

describe("RemovePublicAuthorityUseCase", () => {
  it("keeps current list when remove confirmation is not true", () => {
    const useCase = new RemovePublicAuthorityUseCase();

    const result = useCase.execute("cabinet-office", "false", {
      selectedPublicAuthorities: [
        {
          publicAuthorityId: "cabinet-office",
          publicAuthorityDescription: "Cabinet Office",
        },
      ],
    });

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        selectedPublicAuthorities: [
          {
            publicAuthorityId: "cabinet-office",
            publicAuthorityDescription: "Cabinet Office",
          },
        ],
        hasRemovedPublicAuthority: false,
      },
    });
  });

  it("removes matching public authority when removal is confirmed", () => {
    const useCase = new RemovePublicAuthorityUseCase();

    const result = useCase.execute("cabinet-office", "true", {
      selectedPublicAuthorities: [
        {
          publicAuthorityId: "cabinet-office",
          publicAuthorityDescription: "Cabinet Office",
        },
        {
          publicAuthorityId: "attorney-generals-office",
          publicAuthorityDescription: "Attorney General's Office",
        },
      ],
    });

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.deepEqual(
        result.data.selectedPublicAuthorities.map(
          (publicAuthority) => publicAuthority.publicAuthorityId,
        ),
        ["attorney-generals-office"],
      );
      assert.equal(result.data.hasRemovedPublicAuthority, true);
    }
  });
});
