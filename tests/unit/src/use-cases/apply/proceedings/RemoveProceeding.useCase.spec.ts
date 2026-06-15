import { strict as assert } from "assert";
import { RemoveProceedingUseCase } from "#src/use-cases/apply/proceedings/RemoveProceeding.useCase.js";

describe("RemoveProceedingUseCase", () => {
  it("keeps current list when remove confirmation is not true", () => {
    const useCase = new RemoveProceedingUseCase();

    const result = useCase.execute("MN035", "false", {
      selectedProceedings: [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ],
    });

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        selectedProceedings: [
          {
            proceedingId: "MN035",
            proceedingDescription: "Clinical Negligence",
            matterType: "INQUEST",
          },
        ],
      },
    });
  });

  it("removes matching proceeding and returns a success message when confirmed", () => {
    const useCase = new RemoveProceedingUseCase();

    const result = useCase.execute("MN035", "true", {
      selectedProceedings: [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
        {
          proceedingId: "IQ002",
          proceedingDescription: "Inquest",
          matterType: "INQUEST",
        },
      ],
    });

    assert.equal(result.status, "SUCCESS");

    if (result.status === "SUCCESS") {
      assert.ok(result.data);
      assert.deepEqual(
        result.data.selectedProceedings.map(
          (proceeding) => proceeding.proceedingId,
        ),
        ["IQ002"],
      );
      assert.equal(result.data.successMessage, "Proceeding has been removed");
    }
  });
});
