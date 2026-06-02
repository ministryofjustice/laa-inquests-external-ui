import type {
  Proceeding,
  PublicAuthority,
} from "#src/infrastructure/express/session/index.types.js";
import { ProceedingsSelection } from "#src/domain/proceedings/ProceedingsSelection.js";
import { PublicAuthoritySelection } from "#src/domain/publicAuthority/PublicAuthoritySelection.js";
import type { Option } from "../adaptors/presenters/apply/models/form.types.js";
import type { SummaryListRow } from "../adaptors/presenters/apply/models/summaryList.types.js";

export class Formatter {
  // # TODO Step 5: Move this to separate presenter view mappers and application/domain selection policy helpers.
  filterAvailableOptions(
    selectedProceedings: Proceeding[] | [],
    allProceedings: Proceeding[],
  ): Proceeding[] {
    return ProceedingsSelection.filterAvailable(
      selectedProceedings,
      allProceedings,
    );
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
        key: { text: proceeding.proceedingDescription },
        actions: {
          items: [
            {
              href: `/apply/proceedings/remove?proceedingId=${proceeding.proceedingId}`,
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
        key: { text: publicAuthority.publicAuthorityDescription },
        actions: {
          items: [
            {
              href: `/apply/public-authority/remove?publicAuthorityId=${publicAuthority.publicAuthorityId}`,
              text: "Remove",
            },
          ],
        },
      }),
    );
    return formattedPublicAuthorities;
  }

  formatPublicAuthorityOptionsIntoList(
    publicAuthorityOptions: PublicAuthority[],
  ): Option[] {
    return publicAuthorityOptions.map((authority) => ({
      text: authority.publicAuthorityDescription,
      value: authority.publicAuthorityId,
    }));
  }

  filterAvailablePublicAuthorities(
    selectedPublicAuthorities: PublicAuthority[] | [],
    allPublicAuthorities: PublicAuthority[],
  ): PublicAuthority[] {
    return PublicAuthoritySelection.filterAvailable(
      selectedPublicAuthorities,
      allPublicAuthorities,
    );
  }
}
