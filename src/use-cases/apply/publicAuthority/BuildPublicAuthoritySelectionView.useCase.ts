import {
  EMPTY_ARR_LENGTH,
  PUBLIC_AUTHORITY_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { Formatter } from "#src/utils/Formatter.js";
import type { Option } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { SummaryListRow } from "#src/adaptors/presenters/apply/models/summaryList.types.js";
import type { PublicAuthoritySessionState } from "#src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.js";

interface BuildPublicAuthoritySelectionViewOutput {
  publicAuthorityOptions: Option[];
  selectedPublicAuthorities: SummaryListRow[];
  isAddingAnother: boolean;
}

export class BuildPublicAuthoritySelectionViewUseCase {
  formatter: Formatter;

  constructor(formatter: Formatter) {
    this.formatter = formatter;
  }

  execute(
    state: PublicAuthoritySessionState,
  ): BuildPublicAuthoritySelectionViewOutput {
    const selectedPublicAuthorities = state.selectedPublicAuthorities ?? [];
    const filteredOptions = this.formatter.filterAvailablePublicAuthorities(
      selectedPublicAuthorities,
      PUBLIC_AUTHORITY_OPTIONS,
    );

    return {
      publicAuthorityOptions:
        this.formatter.formatPublicAuthorityOptionsIntoList(filteredOptions),
      selectedPublicAuthorities: this.formatter.formatIntoTableRows(
        selectedPublicAuthorities,
      ),
      isAddingAnother: selectedPublicAuthorities.length > EMPTY_ARR_LENGTH,
    };
  }
}
