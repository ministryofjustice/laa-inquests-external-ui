import type { Address } from "#src/domain/Client/Address.js";
import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildCorrespondenceAddressViewOutput {
  clientCorrespondenceAddress: Address | null;
}

export class BuildCorrespondenceAddressViewUseCase {
  execute(
    state: ClientDetailsSessionState,
  ): BuildCorrespondenceAddressViewOutput {
    return {
      clientCorrespondenceAddress: state.clientCorrespondenceAddress ?? null,
    };
  }
}
