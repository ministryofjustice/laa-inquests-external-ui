import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildPreviousApplicationViewOutput {
  client: {
    hasPrevApplication: string;
    prevLaaReference: string;
  };
}

export class BuildPreviousApplicationViewUseCase {
  execute(
    state: ClientDetailsSessionState,
  ): BuildPreviousApplicationViewOutput {
    return {
      client: {
        hasPrevApplication: state.clientHasPrevApplication ?? "",
        prevLaaReference: state.prevLaaReferenceInput ?? "",
      },
    };
  }
}
