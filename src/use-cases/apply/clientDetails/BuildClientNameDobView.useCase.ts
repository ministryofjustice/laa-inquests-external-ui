import type { ClientDetailsSessionState } from "#src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.js";

interface BuildClientNameDobViewOutput {
  client: {
    clientFirstName: string;
    clientLastName: string;
    clientLastNameAtBirth: string;
    hasNameChanged: string;
    clientDobDay: string;
    clientDobMonth: string;
    clientDobYear: string;
  };
}

export class BuildClientNameDobViewUseCase {
  execute(state: ClientDetailsSessionState): BuildClientNameDobViewOutput {
    return {
      client: {
        clientFirstName: state.clientFirstName ?? "",
        clientLastName: state.clientLastName ?? "",
        clientLastNameAtBirth: state.clientLastNameAtBirth ?? "",
        hasNameChanged: state.hasNameChanged ?? "",
        clientDobDay: state.clientDobDay ?? "",
        clientDobMonth: state.clientDobMonth ?? "",
        clientDobYear: state.clientDobYear ?? "",
      },
    };
  }
}
