import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildCorrespondenceRecipientViewOutput {
  clientCorrespondenceRecipient: ClientDetailsSessionState["clientCorrespondenceRecipient"];
  recipient: CorrespondenceRecipient | null;
  params?: CorrespondenceRecipientViewParams;
}

interface CorrespondenceRecipientViewParams {
  correspondenceRecipient?: string;
  personName?: string;
  organisationName?: string;
}

export class BuildCorrespondenceRecipientViewUseCase {
  execute(
    state: ClientDetailsSessionState,
    recipient: CorrespondenceRecipient | null,
    params?: CorrespondenceRecipientViewParams,
  ): BuildCorrespondenceRecipientViewOutput {
    return {
      clientCorrespondenceRecipient: state.clientCorrespondenceRecipient,
      recipient,
      params,
    };
  }
}
