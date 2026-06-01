import { strict as assert } from "assert";
import { PROCEEDING_OPTIONS } from "#src/infrastructure/locales/constants.js";
import { ProceedingsValidator } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.validator.js";
import { ProcessProceedingSelection } from "#src/application/apply/proceedings/useCases/ProcessProceedingSelection.js";

describe("ProcessProceedingSelection", () => {
  it("returns a validation error when the proceeding option does not match a known option", () => {
    const useCase = new ProcessProceedingSelection(
      new ProceedingsValidator(),
      PROCEEDING_OPTIONS,
    );

    const result = useCase.execute(
      {
        _csrf: "csrf-token",
        "proceeding-option": "INVALID_PROCEEDING",
      },
      [],
    );

    assert.equal(result.type, "validationError");
    if (result.type === "validationError") {
      assert.deepEqual(result.errorSummaries, {
        noProceedingSelected: {
          text: "An application must specify at least one related proceeding.",
        },
      });
    }
  });
});

