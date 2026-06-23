import { strict as assert } from "assert";
import { BuildCheckYourAnswersUseCase } from "#src/use-cases/apply/confirmation/BuildCheckYourAnswers.useCase.js";
import { CORRESPONDENCE_ADDRESS_SOURCE } from "#src/infrastructure/locales/constants.js";

describe("BuildCheckYourAnswersUseCase", () => {
  it("returns the expected check-your-answers shape from session state", () => {
    const useCase = new BuildCheckYourAnswersUseCase();

    const result = useCase.execute({
      clientFirstName: "Jane",
      clientLastName: "Bloggs",
      clientLastNameAtBirth: "Smith",
      clientNino: "AB123456C",
      prevLaaReferenceInput: "L-123-456",
      clientDobDay: "1",
      clientDobMonth: "2",
      clientDobYear: "1990",
      clientHasNoFixedAbode: false,
      clientHomeAddress: {
        addressLine1: "1 Test Street",
        addressLine2: null,
        townOrCity: "London",
        county: null,
        postcode: "SW1A 1AA",
      },
      clientCorrespondenceAddressSource:
        CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
      deceasedFirstName: "Sam",
      deceasedLastName: "Bloggs",
      deceasedDateOfDeathDay: "10",
      deceasedDateOfDeathMonth: "5",
      deceasedDateOfDeathYear: "2024",
      deceasedClientRelationship: "Sibling",
      deceasedCoronerReference: "COR-123",
      selectedPublicAuthorities: [
        {
          publicAuthorityId: "cabinet-office",
          publicAuthorityDescription: "Cabinet Office",
        },
      ],
    });

    assert.deepEqual(result, {
      client: {
        clientFirstName: "Jane",
        clientLastName: "Bloggs",
        clientLastNameAtBirth: "Smith",
        clientNino: "AB123456C",
        prevLaaReferenceInput: "L-123-456",
        clientDobDay: "1",
        clientDobMonth: "2",
        clientDobYear: "1990",
        clientHasNoFixedAbode: false,
        clientHomeAddress: {
          addressLine1: "1 Test Street",
          addressLine2: null,
          townOrCity: "London",
          county: null,
          postcode: "SW1A 1AA",
        },
        clientCorrespondenceAddressSource:
          CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
        clientCorrespondenceAddress: undefined,
        clientCorrespondenceRecipient: undefined,
      },
      deceasedDetails: {
        deceasedFirstName: "Sam",
        deceasedLastName: "Bloggs",
        dateOfDeathDay: "10",
        dateOfDeathMonth: "5",
        dateOfDeathYear: "2024",
        deceasedClientRelationship: "Sibling",
        deceasedCoronerReference: "COR-123",
      },
      publicAuthorities: [
        {
          publicAuthorityId: "cabinet-office",
          publicAuthorityDescription: "Cabinet Office",
        },
      ],
    });
  });

  it("defaults publicAuthorities to an empty array when none are selected", () => {
    const useCase = new BuildCheckYourAnswersUseCase();

    const result = useCase.execute({});

    assert.deepEqual(result.publicAuthorities, []);
  });
});
