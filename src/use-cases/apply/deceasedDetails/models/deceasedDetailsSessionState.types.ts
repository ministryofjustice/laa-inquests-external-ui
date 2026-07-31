import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";

export interface DeceasedDetailsSessionState {
  selectedProceeding?: Proceeding;
  deceasedFirstName?: string;
  deceasedLastName?: string;
  deceasedDateOfDeathDay?: string;
  deceasedDateOfDeathMonth?: string;
  deceasedDateOfDeathYear?: string;
  deceasedDateOfBirthDay?: string;
  deceasedDateOfBirthMonth?: string;
  deceasedDateOfBirthYear?: string;
  deceasedHasClientRelationship?: string;
  deceasedClientRelationship?: string;
  deceasedCoronerReference?: string;
  deceasedHasFurtherInformation?: string;
  deceasedFurtherInformation?: string;
}
