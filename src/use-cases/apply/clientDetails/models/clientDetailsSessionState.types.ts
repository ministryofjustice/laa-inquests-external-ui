import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { CorrespondenceAddressSourceValue } from "#src/adaptors/presenters/apply/models/form.types.js";

export interface ClientDetailsSessionState {
  clientFirstName?: string;
  clientLastName?: string;
  clientLastNameAtBirth?: string;
  hasNameChanged?: string;
  clientDobDay?: string;
  clientDobMonth?: string;
  clientDobYear?: string;
  clientHasNoFixedAbode?: boolean;
  clientHomeAddress?: Address | null;
  clientCorrespondenceAddressSource?: CorrespondenceAddressSourceValue;
  clientCorrespondenceAddress?: Address | null;
  clientCorrespondenceRecipient?: CorrespondenceRecipient | null;
  clientHasPrevApplication?: string;
  prevLaaReferenceInput?: string;
}
