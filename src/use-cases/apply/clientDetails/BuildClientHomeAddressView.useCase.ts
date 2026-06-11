import type { ClientDetailsFormatter } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.js";
import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildClientHomeAddressViewOutput {
  client: {
    homeAddressLine1: string;
    homeAddressLine2: string;
    homeTownOrCity: string;
    homeCounty: string;
    homePostcode: string;
    hasNoFixedAbode: boolean;
  };
}

export class BuildClientHomeAddressViewUseCase {
  formatter: ClientDetailsFormatter;

  constructor(formatter: ClientDetailsFormatter) {
    this.formatter = formatter;
  }

  execute(state: ClientDetailsSessionState): BuildClientHomeAddressViewOutput {
    const client = this.formatter.toHomeAddressViewModel(
      state.clientHomeAddress ?? null,
    );
    client.hasNoFixedAbode = state.clientHasNoFixedAbode === true;

    return {
      client,
    };
  }
}
