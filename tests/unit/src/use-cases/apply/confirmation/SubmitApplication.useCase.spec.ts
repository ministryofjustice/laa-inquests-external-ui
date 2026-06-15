import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { ConfirmationSessionState } from "#src/use-cases/apply/confirmation/models/confirmationSessionState.types.js";
import { SubmitApplicationUseCase } from "#src/use-cases/apply/confirmation/SubmitApplication.useCase.js";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
  HTTP_CREATED,
} from "#src/infrastructure/locales/constants.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";

describe("SubmitApplicationUseCase", () => {
  let applySubmitPort: StubbedInstance<ApplySubmitPort>;
  let useCase: SubmitApplicationUseCase;

  beforeEach(() => {
    applySubmitPort = stubInterface<ApplySubmitPort>();
    useCase = new SubmitApplicationUseCase(applySubmitPort);
  });

  it("returns success with laa reference when the API returns HTTP_CREATED", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.resolves({
      statusCode: HTTP_CREATED,
      laaReference: 123456,
    });

    const result = await useCase.execute(state);

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        laaReference: 123456,
      },
    });
  });

  it("sends the mapped submit body to the apply submit port", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.resolves({
      statusCode: HTTP_CREATED,
      laaReference: 123456,
    });

    await useCase.execute(state);

    assert.equal(applySubmitPort.submitApplication.calledOnce, true);

    const submittedBody = applySubmitPort.submitApplication.getCall(0).args[0];
    assert.deepEqual(submittedBody, {
      client: {
        clientFirstName: state.clientFirstName,
        clientLastName: state.clientLastName,
        clientLastNameAtBirth: state.clientLastNameAtBirth,
        dateOfBirth: formatDateDDMMYYYY(
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
        isClientCorrespondenceRecipient: false,
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
        deceasedDateOfBirth: formatDateDDMMYYYY(
          state.deceasedDateOfBirthYear,
          state.deceasedDateOfBirthMonth,
          state.deceasedDateOfBirthDay,
        ),
        deceasedDateOfDeath: formatDateDDMMYYYY(
          state.deceasedDateOfDeathYear,
          state.deceasedDateOfDeathMonth,
          state.deceasedDateOfDeathDay,
        ),
        coronersReference: state.deceasedCoronerReference,
        furtherInformation: state.deceasedFurtherInformation,
        clientRelationshipToDeceased: state.deceasedClientRelationship,
      },
      proceedings: state.selectedProceedings?.map((proceeding) => ({
        proceedingId: proceeding.proceedingId,
      })),
      publicBodies: state.selectedPublicAuthorities?.map((publicAuthority) => ({
        publicBodyId: publicAuthority.publicAuthorityDescription,
      })),
      provider: {
        firmCode: state.firmCode,
        officeId: state.officeId,
      },
    });
  });

  it("returns invalid input state and does not call adapter when required state is missing", async () => {
    const state = createValidState({
      firmCode: undefined,
    });

    const result = await useCase.execute(state);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
    assert.equal(applySubmitPort.submitApplication.called, false);
  });

  it("returns invalid response when adapter response fails schema validation", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.resolves({
      statusCode: HTTP_CREATED,
      laaReference: "not-a-number",
    } as unknown as { statusCode: number; laaReference: number });

    const result = await useCase.execute(state);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_RESPONSE",
    });
  });

  it("returns upstream rejected when API status code is not HTTP_CREATED", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.resolves({
      statusCode: 500,
      laaReference: 123456,
    });

    const result = await useCase.execute(state);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns unexpected exception when adapter throws", async () => {
    const state = createValidState();
    applySubmitPort.submitApplication.rejects(new Error("network failure"));

    const result = await useCase.execute(state);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
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
    selectedProceedings: [
      {
        proceedingId: "MN035",
        proceedingDescription: "Clinical Negligence",
        matterType: "INQUEST",
      },
    ],
    selectedPublicAuthorities: [
      {
        publicAuthorityId: "cabinet-office",
        publicAuthorityDescription: "Cabinet Office",
      },
    ],
    firmCode: "0A123B",
    officeId: "001",
    ...overrides,
  };
}
