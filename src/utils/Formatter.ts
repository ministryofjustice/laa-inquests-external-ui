import type {
  Proceeding,
  PublicAuthority,
} from "#src/infrastructure/express/session/index.types.js";
import type { Option } from "../adaptors/presenters/apply/models/form.types.js";
import type { SummaryListRow } from "../adaptors/presenters/apply/models/summaryList.types.js";

const TWO_DECIMAL_PLACES = 2;

const GBP_CURRENCY_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: TWO_DECIMAL_PLACES,
  maximumFractionDigits: TWO_DECIMAL_PLACES,
});

export class Formatter {
  formatCurrency(inputValue: string | undefined): string {
    if (typeof inputValue !== "string") {
      return "";
    }

    const parsedValue = Number(inputValue);

    if (!Number.isFinite(parsedValue)) {
      return "";
    }

    return GBP_CURRENCY_FORMATTER.format(parsedValue);
  }

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
      text: proceeding.proceedingName,
      value: proceeding.proceedingId,
    }));
  }

  formatSelectedIntoTableRows(
    selectedProceeding: Proceeding,
  ): SummaryListRow[] {
    return [
      {
        key: { text: selectedProceeding.proceedingName },
      },
    ];
  }

  formatIntoTableRows(
    selectedPublicAuthorities: PublicAuthority[],
  ): SummaryListRow[] {
    const formattedPublicAuthorities = selectedPublicAuthorities.map(
      (publicAuthority) => ({
        key: { text: publicAuthority.publicAuthorityDescription },
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
}
