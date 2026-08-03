import type {
  Proceeding,
  PublicAuthority,
} from "#src/infrastructure/express/session/index.types.js";
import type { Option } from "../adaptors/presenters/apply/models/form.types.js";
import type { SummaryListRow } from "../adaptors/presenters/apply/models/summaryList.types.js";

const TWO_DECIMAL_PLACES = 2;

const BYTES_PER_KB = 1024;
const MIN_DISPLAY_KB = 1;

const GBP_CURRENCY_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: TWO_DECIMAL_PLACES,
  maximumFractionDigits: TWO_DECIMAL_PLACES,
});

export class Formatter {
  formatCurrency(inputValue: string | undefined): string {
    const parsedValue = Number(inputValue);
    if (typeof inputValue === "string" && Number.isFinite(parsedValue)) {
      return GBP_CURRENCY_FORMATTER.format(parsedValue);
    } else {
      return "";
    }
  }

  formatFileSize(fileSize: number | undefined): string {
    if (typeof fileSize !== "number" || !Number.isFinite(fileSize)) {
      return "";
    } else {
      const filesizeInKB = Math.max(
        MIN_DISPLAY_KB,
        Math.round(fileSize / BYTES_PER_KB),
      );
      return `${filesizeInKB}KB`;
    }
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

  formatSelectedIntoTableRows(selectedProceeding: Proceeding): SummaryListRow {
    return {
      key: { text: selectedProceeding.proceedingName },
    };
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
