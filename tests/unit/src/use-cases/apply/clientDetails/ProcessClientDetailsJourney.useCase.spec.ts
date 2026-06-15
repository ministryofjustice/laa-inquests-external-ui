import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { ClientDetailsValidator } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.js";
import { ProcessClientDetailsJourneyUseCase } from "#src/use-cases/apply/clientDetails/ProcessClientDetailsJourney.useCase.js";

describe("ProcessClientDetailsJourneyUseCase", () => {
  let formValidator: StubbedInstance<ClientDetailsValidator>;
  let useCase: ProcessClientDetailsJourneyUseCase;

  beforeEach(() => {
    formValidator = stubInterface<ClientDetailsValidator>();
    useCase = new ProcessClientDetailsJourneyUseCase(formValidator);
  });

  it("merges name and date of birth validation errors for NAME_DOB step", () => {
    formValidator.validateClientName.returns({
      firstNameInputError: { text: "Missing first name" },
    });
    formValidator.validateClientDob.returns({
      dobInputError: { text: "Missing date of birth" },
    });

    const result = useCase.execute({
      step: "NAME_DOB",
      formBody: {
        "first-name": "",
        "last-name": "Bloggs",
      },
    });

    assert.deepEqual(result.errorSummaries, {
      firstNameInputError: { text: "Missing first name" },
      dobInputError: { text: "Missing date of birth" },
    });
  });

  it("passes hasNoFixedAbode to correspondence address source validation", () => {
    formValidator.validateCorrespondenceAddressSource.returns({
      noRadioSelected: { text: "Select an option" },
    });

    const formBody = {
      "correspondence-address-source": "USE_CLIENT_HOME_ADDRESS",
    };

    const result = useCase.execute({
      step: "CORRESPONDENCE_ADDRESS_SOURCE",
      formBody,
      hasNoFixedAbode: true,
    });

    assert.deepEqual(result.errorSummaries, {
      noRadioSelected: { text: "Select an option" },
    });
  });

  it("uses correspondence recipient validation for CORRESPONDENCE_RECIPIENT step", () => {
    formValidator.validateCorrespondenceRecipient.returns({
      noRadioSelected: { text: "Select an option" },
    });

    const result = useCase.execute({
      step: "CORRESPONDENCE_RECIPIENT",
      formBody: {},
    });

    assert.deepEqual(result.errorSummaries, {
      noRadioSelected: { text: "Select an option" },
    });
  });
});
