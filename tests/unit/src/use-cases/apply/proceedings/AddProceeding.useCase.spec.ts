import { strict as assert } from "assert";
import { AddProceedingUseCase } from "#src/use-cases/apply/proceedings/AddProceeding.useCase.js";

describe("AddProceedingUseCase", () => {
  it("returns technical failure when proceeding option is missing", () => {
    const useCase = new AddProceedingUseCase();

    const result = useCase.execute(undefined, {
      selectedProceedings: [],
    });

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("adds selected proceeding to the top of the selected list", () => {
    const useCase = new AddProceedingUseCase();

    const result = useCase.execute("IQPO", {
      selectedProceedings: [
        {
          proceedingId: "IQPC",
          proceedingName: "Death in police custody",
          matterType: "INQUEST",
        },
      ],
    });

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.equal(result.data.selectedProceeding.proceedingId, "IQPO");
      assert.deepEqual(
        result.data.selectedProceedings.map(
          (proceeding) => proceeding.proceedingId,
        ),
        ["IQPO", "IQPC"],
      );
    }
  });
});
