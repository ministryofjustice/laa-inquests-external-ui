import type { DeceasedDetailsSessionState } from "#src/use-cases/apply/deceasedDetails/models/deceasedDetailsSessionState.types.js";

export type DeceasedDetailsStep =
  | "name"
  | "dateOfDeath"
  | "dateOfBirth"
  | "clientRelationship"
  | "coronerReference"
  | "furtherInformation";

interface BuildDeceasedDetailsViewOutput {
  deceasedDetails: Record<string, string | undefined>;
}

export class BuildDeceasedDetailsViewUseCase {
  execute(
    //   COPILOT TODO: I don't want this called step, I think it could be called "detail" or similar
    step: DeceasedDetailsStep,
    state: DeceasedDetailsSessionState,
  ): BuildDeceasedDetailsViewOutput {
    if (step === "name") {
      return {
        deceasedDetails: {
          firstName: state.deceasedFirstName,
          lastName: state.deceasedLastName,
        },
      };
    }

    if (step === "dateOfDeath") {
      return {
        deceasedDetails: {
          dateOfDeathDay: state.deceasedDateOfDeathDay,
          dateOfDeathMonth: state.deceasedDateOfDeathMonth,
          dateOfDeathYear: state.deceasedDateOfDeathYear,
        },
      };
    }

    if (step === "dateOfBirth") {
      return {
        deceasedDetails: {
          dateOfBirthDay: state.deceasedDateOfBirthDay,
          dateOfBirthMonth: state.deceasedDateOfBirthMonth,
          dateOfBirthYear: state.deceasedDateOfBirthYear,
        },
      };
    }

    if (step === "clientRelationship") {
      return {
        deceasedDetails: {
          hasClientRelationship: state.deceasedHasClientRelationship,
          clientRelationship: state.deceasedClientRelationship,
        },
      };
    }

    if (step === "coronerReference") {
      return {
        deceasedDetails: {
          coronerReference: state.deceasedCoronerReference,
        },
      };
    }

    return {
      deceasedDetails: {
        hasFurtherInformation: state.deceasedHasFurtherInformation,
        furtherInformation: state.deceasedFurtherInformation,
      },
    };
  }
}
