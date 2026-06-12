import type { Address } from "#src/domain/Client/Address.js";
import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildClientHomeAddressViewOutput {
  clientHomeAddress: Address | null;
  clientHasNoFixedAbode: boolean;
}

export class BuildClientHomeAddressViewUseCase {
  execute(state: ClientDetailsSessionState): BuildClientHomeAddressViewOutput {
    return {
      clientHomeAddress: state.clientHomeAddress ?? null,
      clientHasNoFixedAbode: state.clientHasNoFixedAbode === true,
    };
  }
}
