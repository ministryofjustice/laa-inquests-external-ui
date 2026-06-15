import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { PublicAuthority } from "#src/infrastructure/express/session/index.types.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";

export interface BuildCheckYourAnswersOutput {
  client: {
    clientFirstName?: string;
    clientLastName?: string;
    clientDobDay?: string;
    clientDobMonth?: string;
    clientDobYear?: string;
    clientHasNoFixedAbode?: boolean;
    clientHomeAddress?: Address | null;
    clientCorrespondenceAddressSource?: SubmitApplicationRequest["client"]["correspondenceAddressSource"];
    clientCorrespondenceAddress?: Address | null;
    clientCorrespondenceRecipient?: CorrespondenceRecipient | null;
  };
  deceasedDetails: {
    deceasedFirstName?: string;
    deceasedLastName?: string;
    dateOfDeathDay?: string;
    dateOfDeathMonth?: string;
    dateOfDeathYear?: string;
    deceasedClientRelationship?: string;
    deceasedCoronerReference?: string;
  };
  publicAuthorities: PublicAuthority[];
}

export class BuildCheckYourAnswersUseCase {
  execute(state: ConfirmationSessionState): BuildCheckYourAnswersOutput {
    return {
      client: {
        clientFirstName: state.clientFirstName,
        clientLastName: state.clientLastName,
        clientDobDay: state.clientDobDay,
        clientDobMonth: state.clientDobMonth,
        clientDobYear: state.clientDobYear,
        clientHasNoFixedAbode: state.clientHasNoFixedAbode,
        clientHomeAddress: state.clientHomeAddress,
        clientCorrespondenceAddressSource:
          state.clientCorrespondenceAddressSource,
        clientCorrespondenceAddress: state.clientCorrespondenceAddress,
        clientCorrespondenceRecipient: state.clientCorrespondenceRecipient,
      },
      deceasedDetails: {
        deceasedFirstName: state.deceasedFirstName,
        deceasedLastName: state.deceasedLastName,
        dateOfDeathDay: state.deceasedDateOfDeathDay,
        dateOfDeathMonth: state.deceasedDateOfDeathMonth,
        dateOfDeathYear: state.deceasedDateOfDeathYear,
        deceasedClientRelationship: state.deceasedClientRelationship,
        deceasedCoronerReference: state.deceasedCoronerReference,
      },
      publicAuthorities: state.selectedPublicAuthorities ?? [],
    };
  }
}
