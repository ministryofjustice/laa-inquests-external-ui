import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { v4 as uuidv4 } from "uuid";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import { SubmitApplicationUseCase } from "#src/use-cases/apply/confirmation/SubmitApplication.useCase.js";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
} from "#src/infrastructure/locales/constants.js";
import { formatDateISOYYYYMMDD } from "#src/utils/dateFormatter.js";

describe("SubmitApplicationUseCase", () => {
  let applySubmitPort: StubbedInstance<ApplySubmitPort>;
  let useCase: SubmitApplicationUseCase;

  beforeEach(() => {
    applySubmitPort = stubInterface<ApplySubmitPort>();
    useCase = new SubmitApplicationUseCase(applySubmitPort);
  });

  it("returns the laa reference when the API succeeds", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.resolves({
      laaReference: "123456",
    });

    const result = await useCase.execute(state);

    assert.deepEqual(result, {
      laaReference: "123456",
    });
  });

  it("sends the mapped submit body to the apply submit port", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.resolves({
      laaReference: "123456",
    });

    await useCase.execute(state);

    assert.equal(applySubmitPort.submitApplication.calledOnce, true);

    const submittedBody = applySubmitPort.submitApplication.getCall(0).args[0];
    const submittedAccessToken =
      applySubmitPort.submitApplication.getCall(0).args[1];
    assert.deepEqual(submittedBody, {
      client: {
        clientFirstName: state.clientFirstName,
        clientLastName: state.clientLastName,
        clientLastNameAtBirth: state.clientLastNameAtBirth,
        dateOfBirth: formatDateISOYYYYMMDD(
          state.clientDobYear,
          state.clientDobMonth,
          state.clientDobDay,
        ),
        hasNoFixedAbode: state.clientHasNoFixedAbode,
        nationalInsuranceNumber: state.clientNino,
        correspondenceAddressSource: state.clientCorrespondenceAddressSource,
        correspondenceAddress: {
          addressLine1: state.clientCorrespondenceAddress?.addressLine1,
          addressLine2: state.clientCorrespondenceAddress?.addressLine2,
          townOrCity: state.clientCorrespondenceAddress?.townOrCity,
          county: state.clientCorrespondenceAddress?.county,
          postcode: state.clientCorrespondenceAddress?.postcode,
        },
        correspondenceRecipient: {
          recipientType: state.clientCorrespondenceRecipient?.recipientType,
          recipientName: state.clientCorrespondenceRecipient?.recipientName,
        },
        homeAddress: {
          addressLine1: state.clientHomeAddress?.addressLine1,
          addressLine2: state.clientHomeAddress?.addressLine2,
          townOrCity: state.clientHomeAddress?.townOrCity,
          county: state.clientHomeAddress?.county,
          postcode: state.clientHomeAddress?.postcode,
        },
      },
      deceased: {
        deceasedFirstName: state.deceasedFirstName,
        deceasedLastName: state.deceasedLastName,
        deceasedDateOfBirth: formatDateISOYYYYMMDD(
          state.deceasedDateOfBirthYear,
          state.deceasedDateOfBirthMonth,
          state.deceasedDateOfBirthDay,
        ),
        deceasedDateOfDeath: formatDateISOYYYYMMDD(
          state.deceasedDateOfDeathYear,
          state.deceasedDateOfDeathMonth,
          state.deceasedDateOfDeathDay,
        ),
        coronersReference: state.deceasedCoronerReference,
        furtherInformation: state.deceasedFurtherInformation,
        clientRelationshipToDeceased: state.deceasedClientRelationship,
      },
      proceeding: state.selectedProceeding
        ? { proceedingId: state.selectedProceeding.proceedingId }
        : null,
      publicBodies: state.selectedPublicAuthorities?.map((publicAuthority) => ({
        publicBodyId: publicAuthority.publicAuthorityId,
      })),
      provider: {
        officeId: state.officeId,
        emailAddress: state.providerEmail,
      },
      coronersLetterId: state.coronersLetterId,
    });
    assert.equal(submittedAccessToken, state.accessToken);
  });

  it("throws and does not call the adapter when required state is missing", async () => {
    const state = createValidState({
      officeId: undefined,
    });

    await assert.rejects(useCase.execute(state));
    assert.equal(applySubmitPort.submitApplication.called, false);
  });

  it("propagates errors thrown by the adapter", async () => {
    const state = createValidState();
    const error = new Error("network failure");
    applySubmitPort.submitApplication.rejects(error);

    await assert.rejects(useCase.execute(state), error);
  });
});

function createValidState(
  overrides: Partial<ConfirmationSessionState> = {},
): ConfirmationSessionState {
  return {
    clientFirstName: "Jane",
    clientLastName: "Bloggs",
    clientLastNameAtBirth: "Doe",
    clientDobDay: "01",
    clientDobMonth: "02",
    clientDobYear: "1990",
    clientNino: "AB123456C",
    clientHasNoFixedAbode: false,
    clientHomeAddress: {
      addressLine1: "1 Test Street",
      addressLine2: null,
      townOrCity: "London",
      county: null,
      postcode: "SW1A 1AA",
    },
    clientCorrespondenceAddressSource:
      CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS,
    clientCorrespondenceAddress: {
      addressLine1: "2 Example Road",
      addressLine2: null,
      townOrCity: "Leeds",
      county: null,
      postcode: "LS1 1AA",
    },
    clientCorrespondenceRecipient: {
      recipientType: CORRESPONDENCE_RECIPIENT_TYPE.PERSON,
      recipientName: "Jane Bloggs",
    },
    deceasedFirstName: "Sam",
    deceasedLastName: "Bloggs",
    deceasedDateOfBirthDay: "01",
    deceasedDateOfBirthMonth: "01",
    deceasedDateOfBirthYear: "1960",
    deceasedDateOfDeathDay: "10",
    deceasedDateOfDeathMonth: "03",
    deceasedDateOfDeathYear: "2024",
    deceasedClientRelationship: "Sibling",
    deceasedCoronerReference: "COR-123",
    deceasedFurtherInformation: "No additional details",
    selectedProceeding: {
      proceedingId: "IQCN",
      proceedingName: "Clinical Negligence",
      matterType: "INQUEST",
    },
    selectedPublicAuthorities: [
      {
        publicAuthorityId: "Cabinet Office",
        publicAuthorityDescription: "Cabinet Office",
      },
    ],
    officeId: "001",
    accessToken: "access-token-123",
    coronersLetterId: uuidv4(),
    providerEmail: "test@example.com",
    ...overrides,
  };
}
