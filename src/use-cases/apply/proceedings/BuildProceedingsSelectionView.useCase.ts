import { PROCEEDING_OPTIONS } from "#src/infrastructure/locales/constants.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { ProceedingsSessionState } from "#src/use-cases/apply/proceedings/models/proceedingsSessionState.types.js";

export interface BuildProceedingsSelectionViewOutput {
  availableProceedings: Proceeding[];
  selectedProceedings: Proceeding[];
}

export class BuildProceedingsSelectionViewUseCase {
  execute(state: ProceedingsSessionState): BuildProceedingsSelectionViewOutput {
    const selectedProceedings = state.selectedProceedings ?? [];
    const availableProceedings = PROCEEDING_OPTIONS.filter(
      (option) =>
        !selectedProceedings.some(
          (selectedOption) =>
            selectedOption.proceedingId === option.proceedingId,
        ),
    );

    return {
      availableProceedings,
      selectedProceedings,
    };
  }
}
