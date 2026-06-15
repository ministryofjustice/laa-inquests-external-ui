import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import type { ProceedingsSessionState } from "#src/use-cases/apply/proceedings/models/proceedingsSessionState.types.js";

interface RemoveProceedingOutput {
  selectedProceedings: Proceeding[];
  successMessage?: string;
}

export class RemoveProceedingUseCase {
  execute(
    proceedingId: string,
    removeProceeding: string,
    state: ProceedingsSessionState,
  ): UseCaseResult<RemoveProceedingOutput> {
    if (removeProceeding !== "true") {
      return {
        status: "SUCCESS",
        data: {
          selectedProceedings: state.selectedProceedings ?? [],
        },
      };
    }

    return {
      status: "SUCCESS",
      data: {
        selectedProceedings: (state.selectedProceedings ?? []).filter(
          (proceeding) => proceeding.proceedingId !== proceedingId,
        ),
        successMessage: "Proceeding has been removed",
      },
    };
  }
}
