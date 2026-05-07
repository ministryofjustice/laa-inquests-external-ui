import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import assert from "assert";

describe("DeceasedDetails.validator", () => {
  it("Adds error when first name is empty", () => {
    const validator = new DeceasedDetailsValidator();
    const body = {
      "deceased-first-name": "",
      "deceased-last-name": "Test",
    };
    const errorSummaries = validator.validateName(body);
    assert.deepEqual(errorSummaries, {
      firstNameInputError: {
        text: DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
      },
    });
  });

  it("Adds error when last name is empty", () => {
    const validator = new DeceasedDetailsValidator();
    const body = {
      "deceased-first-name": "Test",
      "deceased-last-name": "",
    };
    const errorSummaries = validator.validateName(body);
    assert.deepEqual(errorSummaries, {
      lastNameInputError: {
        text: DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
      },
    });
  });

  it("Adds error when first name is over 100 characters", () => {
    const validator = new DeceasedDetailsValidator();
    const body = {
      "deceased-first-name": "a".repeat(101),
      "deceased-last-name": "Test",
    };
    const errorSummaries = validator.validateName(body);
    assert.deepEqual(errorSummaries, {
      firstNameInputError: {
        text: DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      },
    });
  });

  it("Adds error when last name is over 100 characters", () => {
    const validator = new DeceasedDetailsValidator();
    const body = {
      "deceased-first-name": "Test",
      "deceased-last-name": "a".repeat(101),
    };
    const errorSummaries = validator.validateName(body);
    assert.deepEqual(errorSummaries, {
      lastNameInputError: {
        text: DECEASED_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      },
    });
  });
});
