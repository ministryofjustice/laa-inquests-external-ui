import type { ClientDetailsFormatter } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildCorrespondenceRecipientViewOutput {
  client: {
    correspondenceRecipient: string;
    correspondenceRecipientPersonName: string;
    correspondenceRecipientOrganisationName: string;
  };
}

interface CorrespondenceRecipientViewParams {
  correspondenceRecipient?: string;
  personName?: string;
  organisationName?: string;
}

export class BuildCorrespondenceRecipientViewUseCase {
  formatter: ClientDetailsFormatter;

  constructor(formatter: ClientDetailsFormatter) {
    this.formatter = formatter;
  }

  execute(
    state: ClientDetailsSessionState,
    recipient: CorrespondenceRecipient | null,
    params?: CorrespondenceRecipientViewParams,
  ): BuildCorrespondenceRecipientViewOutput {
    return {
      client: this.formatter.buildCorrespondenceRecipientViewModel(
        {
          session: {
            clientCorrespondenceRecipient: state.clientCorrespondenceRecipient,
          },
        },
        recipient,
        params,
      ),
    };
  }
}
