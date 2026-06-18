import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type {
  Proceeding,
  PublicAuthority,
} from "#src/infrastructure/express/session/index.types.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";

export interface ConfirmationSessionState {
  clientFirstName?: string;
  clientLastName?: string;
  clientLastNameAtBirth?: string | null;
  clientDobDay?: string;
  clientDobMonth?: string;
  clientDobYear?: string;
  clientNino?: string | null;
  clientHomeAddress?: Address | null;
  clientCorrespondenceAddress?: Address | null;
  clientCorrespondenceAddressSource?: SubmitApplicationRequest["client"]["correspondenceAddressSource"];
  clientCorrespondenceRecipient?: CorrespondenceRecipient | null;
  clientHasNoFixedAbode?: boolean;
  deceasedFirstName?: string;
  deceasedLastName?: string;
  deceasedDateOfBirthDay?: string;
  deceasedDateOfBirthMonth?: string;
  deceasedDateOfBirthYear?: string;
  deceasedDateOfDeathDay?: string;
  deceasedDateOfDeathMonth?: string;
  deceasedDateOfDeathYear?: string;
  deceasedClientRelationship?: string;
  deceasedCoronerReference?: string;
  deceasedFurtherInformation?: string;
  selectedProceedings?: Proceeding[];
  selectedPublicAuthorities?: PublicAuthority[];
  firmCode?: string;
  officeId?: string;
  coronersLetterId?: string;
}
