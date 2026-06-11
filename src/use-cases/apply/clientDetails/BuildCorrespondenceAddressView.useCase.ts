import type { ClientDetailsFormatter } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.js";
import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildCorrespondenceAddressViewOutput {
  client: {
    correspondenceAddressLine1: string;
    correspondenceAddressLine2: string;
    correspondenceTownOrCity: string;
    correspondenceCounty: string;
    correspondencePostcode: string;
  };
}

export class BuildCorrespondenceAddressViewUseCase {
  formatter: ClientDetailsFormatter;

  constructor(formatter: ClientDetailsFormatter) {
    this.formatter = formatter;
  }

  execute(
    state: ClientDetailsSessionState,
  ): BuildCorrespondenceAddressViewOutput {
    return {
      client: this.formatter.toCorrespondenceAddressViewModel(
        state.clientCorrespondenceAddress ?? null,
      ),
    };
  }
}
