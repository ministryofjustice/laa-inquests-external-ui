import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildCorrespondenceAddressSourceViewOutput {
  client: {
    correspondenceAddressSource: string;
  };
}

export class BuildCorrespondenceAddressSourceViewUseCase {
  execute(
    state: ClientDetailsSessionState,
  ): BuildCorrespondenceAddressSourceViewOutput {
    return {
      client: {
        correspondenceAddressSource:
          state.clientCorrespondenceAddressSource ?? "",
      },
    };
  }
}
