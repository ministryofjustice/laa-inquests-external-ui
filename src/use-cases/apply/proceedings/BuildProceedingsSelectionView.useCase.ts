import type { Formatter } from "#src/utils/Formatter.js";
import { PROCEEDING_OPTIONS } from "#src/infrastructure/locales/constants.js";
import type { Option } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { SummaryListRow } from "#src/adaptors/presenters/apply/models/summaryList.types.js";
import type { ProceedingsSessionState } from "#src/use-cases/apply/proceedings/models/proceedingsSessionState.types.js";

interface BuildProceedingsSelectionViewOutput {
  proceedingOptions: Option[];
  selectedProceedings: SummaryListRow[];
}

export class BuildProceedingsSelectionViewUseCase {
  formatter: Formatter;

  constructor(formatter: Formatter) {
    this.formatter = formatter;
  }

  execute(state: ProceedingsSessionState): BuildProceedingsSelectionViewOutput {
    const selectedProceedings = state.selectedProceedings ?? [];
    const filteredProceedingOptions = this.formatter.filterAvailableOptions(
      selectedProceedings,
      PROCEEDING_OPTIONS,
    );

    return {
      proceedingOptions: this.formatter.formatOptionsIntoList(
        filteredProceedingOptions,
      ),
      selectedProceedings:
        this.formatter.formatSelectedIntoTableRows(selectedProceedings),
    };
  }
}
