import type { Proceeding, PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { Option } from "../adaptors/presenters/apply/models/form.types.js";
import type { SummaryListRow } from "../adaptors/presenters/apply/models/summaryList.types.js";

export class Formatter {
  filterAvailableOptions(
    selectedProceedings: Proceeding[] | [],
    allProceedings: Proceeding[],
  ): Proceeding[] {
    const formattedProceedingOptions = allProceedings.filter(
      (option) =>
        !selectedProceedings.some(
          (selectedOption) =>
            selectedOption.proceedingId === option.proceedingId,
        ),
    );

    return formattedProceedingOptions;
  }

  formatOptionsIntoList(proceedingOptions: Proceeding[]): Option[] {
    return proceedingOptions.map((proceeding) => ({
      text: proceeding.proceedingDescription,
      value: proceeding.proceedingId,
    }));
  }

  formatSelectedIntoTableRows(
    selectedProceedings: Proceeding[],
  ): SummaryListRow[] {
    const formattedSelectedProceedings = selectedProceedings.map(
      (proceeding) => ({
        key: { text: proceeding.proceedingId },
        value: { text: proceeding.proceedingDescription },
        actions: {
          items: [
            {
              text: "Remove",
            },
          ],
        },
      }),
    );
    return formattedSelectedProceedings;
  }

  formatIntoTableRows(
    selectedPublicAuthorities: PublicAuthority[],
  ): SummaryListRow[] {
    const formattedPublicAuthorities = selectedPublicAuthorities.map(
      (publicAuthority) => ({
        key: { text: publicAuthority.publicAuthorityId},
        value: { text: publicAuthority.publicAuthorityDescription },
      }),
    );
    return formattedPublicAuthorities;
  }
}
