import { PROCEEDING_OPTIONS } from "#src/infrastructure/locales/constants.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { ProceedingsSessionState } from "#src/use-cases/apply/proceedings/models/proceedingsSessionState.types.js";

interface AddProceedingOutput {
  selectedProceeding: Proceeding;
  selectedProceedings: Proceeding[];
}

export class AddProceedingUseCase {
  execute(
    proceedingOption: string | undefined,
    state: ProceedingsSessionState,
  ): UseCaseResult<AddProceedingOutput> {
    if (typeof proceedingOption !== "string") {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    const selectedProceeding = PROCEEDING_OPTIONS.find(
      (option) => option.proceedingId === proceedingOption,
    );

    if (selectedProceeding === undefined) {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "INVALID_INPUT_STATE",
      };
    }

    return {
      status: "SUCCESS",
      data: {
        selectedProceeding,
        selectedProceedings: [
          selectedProceeding,
          ...(state.selectedProceedings ?? []),
        ],
      },
    };
  }
}
