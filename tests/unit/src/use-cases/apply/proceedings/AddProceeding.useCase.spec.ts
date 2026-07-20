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

    const result = useCase.execute("MN035", {
      selectedProceedings: [
        {
          proceedingId: "IQ002",
          proceedingName: "Inquest",
          matterType: "INQUEST",
        },
      ],
    });

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.equal(result.data.selectedProceeding.proceedingId, "MN035");
      assert.deepEqual(
        result.data.selectedProceedings.map(
          (proceeding) => proceeding.proceedingId,
        ),
        ["MN035", "IQ002"],
      );
    }
  });
});
