import { assert } from "chai";
import { ClientDetailsValidator } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.js";
import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("ClientDetailsValidator", () => {
  describe("methods", () => {
    describe("validateClientDob", () => {
      it("adds error when day in dob is not provided", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "",
          "dob-month": "11",
          "dob-year": "1990",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);
        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
          },
        });
      });
      it("adds error when month in dob is not provided", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "31",
          "dob-month": "",
          "dob-year": "1990",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);
        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
          },
        });
      });
      it("adds error when year in dob is not provided", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "31",
          "dob-month": "12",
          "dob-year": "",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);

        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
          },
        });
      });
      it("adds error when date is non-numeric", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "abc",
          "dob-month": "abc",
          "dob-year": "abc",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);

        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.NON_NUMERIC_DATE,
          },
        });
      });
      it("adds error when date is in the future", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "3000",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);
        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.FUTURE_DATE,
          },
        });
      });
    });
    describe("validateClientName", () => {
      it("add error for no first name input when first name value is empty", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);

        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
          },
        });
      });
      it("add error message for when first name exceeds max character length", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "abcde".repeat(21),
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);

        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
      it("add error message for no last name input provided when last name value is empty", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "greggs",
          "last-name": "",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };

        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
          },
        });
      });
      it("add error message for when last name exceeds max character length", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "fgdsfg",
          "last-name": "abcde".repeat(21),
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
      it("adds error message when no radio button has been selected for name change", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "greggs",
          "last-name": "sausage-roll",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          noRadioSelected: { text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED },
        });
      });
      it("adds error message when yes radio button has been selected but no previous name has been provided", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "greggs",
          "last-name": "sausage-roll",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "true",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          noBirthNameSpecified: {
            text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME_AT_BIRTH,
          },
        });
      });
      it("adds error messages for each input when multiple are not populated", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
          },
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
          },
        });
      });
      it("adds error messages for each input when multiple are exceeding character limit", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "a".repeat(101),
          "last-name": "a".repeat(101),
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
    });
    describe("validateNino", () => {
      it("adds error message when no option is selected", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
        };
        const errorSummaries = formValidator.validateNino(formBody);
        assert.deepEqual(errorSummaries, {
          noRadioSelected: {
            text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
          },
        });
      });
      it("adds error message when yes selected but no nino provided", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "has-nino": "true",
          "nino-input": "",
        };
        const errorSummaries = formValidator.validateNino(formBody);
        assert.deepEqual(errorSummaries, {
          ninoInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_NINO,
          },
        });
      });

      it("adds error message when nino provided is invalid format", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "has-nino": "true",
          "nino-input": "12345679",
        };
        const errorSummaries = formValidator.validateNino(formBody);
        assert.deepEqual(errorSummaries, {
          ninoInputError: {
            text: CLIENT_DETAILS_ERROR.INVALID_NINO,
          },
        });
      });

      const invalidNinoTests = [
        { nino: "DF123456A", reason: "D and F cannot be in first 2 letters" },
        { nino: "FD123456A", reason: "D and F cannot be in first 2 letters" },
        { nino: "IQ123456A", reason: "I and Q cannot be in first 2 letters" },
        { nino: "QI123456A", reason: "I and Q cannot be in first 2 letters" },
        { nino: "UV123456A", reason: "U and V cannot be in first 2 letters" },
        { nino: "VU123456A", reason: "U and V cannot be in first 2 letters" },
        { nino: "BG123456A", reason: "BG cannot be prefix" },
        { nino: "GB123456A", reason: "GB cannot be prefix" },
        { nino: "NK123456A", reason: "NK cannot be prefix" },
        { nino: "KN123456A", reason: "KN cannot be prefix" },
        { nino: "TN123456A", reason: "TN cannot be prefix" },
        { nino: "NT123456A", reason: "NT cannot be prefix" },
        { nino: "ZZ123456A", reason: "ZZ cannot be prefix" },
        { nino: "PP123456E", reason: "A, B, C or D must be last letter" },
      ];

      invalidNinoTests.forEach(({ nino, reason }) => {
        it(`adds error message when nino provided is invalid due to ${reason}`, function () {
          const formValidator = new ClientDetailsValidator();
          const formBody = {
            _csrf: "abcdefg",
            "has-nino": "true",
            "nino-input": nino,
          };
          const errorSummaries = formValidator.validateNino(formBody);
          assert.deepEqual(errorSummaries, {
            ninoInputError: {
              text: CLIENT_DETAILS_ERROR.INVALID_NINO,
            },
          });
        });
      });

      const validNinoTests = [
        { nino: "PP123456A", reason: "A, B, C or D being last letter" },
        { nino: "PP123456B", reason: "A, B, C or D being last letter" },
        { nino: "PP123456C", reason: "A, B, C or D being last letter" },
        { nino: "PP123456D", reason: "A, B, C or D being last letter" },
        { nino: "pp123456d", reason: "being case insensitive" },
        { nino: "PP 123456 A", reason: "allows whitespace between blocks" },
      ];

      validNinoTests.forEach(({ nino, reason }) => {
        it(`Nino is valid due to ${reason}`, function () {
          const formValidator = new ClientDetailsValidator();
          const formBody = {
            _csrf: "abcdefg",
            "has-nino": "true",
            "nino-input": nino,
          };
          const errorSummaries = formValidator.validateNino(formBody);
          assert.deepEqual(errorSummaries, {});
        });
      });
    });
    describe("validatePrevApplicationReference", () => {
      it("adds error message if no option selected", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
        };
        const errorSummaries =
          formValidator.validatePrevApplicationReference(formBody);
        assert.deepEqual(errorSummaries, {
          noRadioSelected: {
            text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
          },
        });
      });
      it("adds error message if yes radio is selected but no reference provided", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "has-prev-application": "true",
          "prev-laa-reference-input": "",
        };
        const errorSummaries =
          formValidator.validatePrevApplicationReference(formBody);
        assert.deepEqual(errorSummaries, {
          referenceInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_PREV_APPLICATION_REF,
          },
        });
      });
      it("adds error message if reference exceeds 35 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "has-prev-application": "true",
          "prev-laa-reference-input": "a".repeat(36),
        };
        const errorSummaries =
          formValidator.validatePrevApplicationReference(formBody);
        assert.deepEqual(errorSummaries, {
          referenceInputError: {
            text: CLIENT_DETAILS_ERROR.APPLICATION_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
    });

    describe("validateHomeAddress", () => {
      it("adds error when address line 1 is missing", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_HOME_ADDRESS_LINE_1,
          },
        });
      });

      it("adds error when address line 1 is less than 2 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "A",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when address line 1 contains no alphanumeric characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "---",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER,
          },
        });
      });

      it("adds error when address line 1 contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "Flat 1@",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when address line 2 is less than 2 characters when populated", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-address-line-2": "A",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine2InputError: {
            text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when address line 2 contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-address-line-2": "Flat 1@",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine2InputError: {
            text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when town or city is missing", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_HOME_TOWN_OR_CITY,
          },
        });
      });

      it("adds error when town or city is less than 2 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "A",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.HOME_TOWN_OR_CITY_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when town or city contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London2",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.HOME_TOWN_OR_CITY_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when county is less than 3 characters when populated", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London",
          "home-county": "AB",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          countyInputError: {
            text: CLIENT_DETAILS_ERROR.HOME_COUNTY_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when county contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London",
          "home-county": "Surrey2",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          countyInputError: {
            text: CLIENT_DETAILS_ERROR.HOME_COUNTY_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when postcode is missing", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London",
          "home-postcode": "",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          postcodeInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_HOME_POSTCODE,
          },
        });
      });

      it("adds error when postcode is less than 5 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London",
          "home-postcode": "A1 1",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          postcodeInputError: {
            text: CLIENT_DETAILS_ERROR.HOME_POSTCODE_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when postcode contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London",
          "home-postcode": "SW1A-1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {
          postcodeInputError: {
            text: CLIENT_DETAILS_ERROR.HOME_POSTCODE_INVALID_CHARACTERS,
          },
        });
      });

      it("returns no errors when required fields are valid", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "4 Privet Drive",
          "home-town-or-city": "London",
          "home-postcode": "SW1A 1AA",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {});
      });

      it("returns no errors when optional fields are blank and values are within new rules", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "home-address-line-1": "1A",
          "home-address-line-2": "",
          "home-town-or-city": "Ly",
          "home-county": "",
          "home-postcode": "A1 1A",
        };

        const errorSummaries = formValidator.validateHomeAddress(formBody);
        assert.deepEqual(errorSummaries, {});
      });
    });

    describe("validateCorrespondenceAddressSource", () => {
      it("adds error when no correspondence source option selected", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddressSource(formBody, false);

        assert.deepEqual(errorSummaries, {
          noRadioSelected: {
            text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
          },
        });
      });

      it("adds error when home address option selected and client has no fixed abode", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-source": "USE_CLIENT_HOME_ADDRESS",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddressSource(formBody, true);

        assert.deepEqual(errorSummaries, {
          noRadioSelected: {
            text: CLIENT_DETAILS_ERROR.INVALID_CORRESPONDENCE_SOURCE_FOR_NO_FIXED_ABODE,
          },
        });
      });

      it("returns no errors when office option selected", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-source": "USE_PROVIDER_ADDRESS",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddressSource(formBody, true);

        assert.deepEqual(errorSummaries, {});
      });
    });

    describe("validateCorrespondenceAddress", () => {
      it("adds error when correspondence address line 1 is missing", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_ADDRESS_LINE_1,
          },
        });
      });

      it("adds error when correspondence address line 1 is less than 2 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "A",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_1_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when correspondence address line 1 contains no alphanumeric characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "---",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER,
          },
        });
      });

      it("adds error when correspondence address line 1 contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "Flat 1@",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine1InputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_1_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when correspondence address line 2 is less than 2 characters when populated", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-address-line-2": "A",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine2InputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_2_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when correspondence address line 2 contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-address-line-2": "Flat 1@",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          addressLine2InputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_2_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when correspondence town or city is missing", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_TOWN_OR_CITY,
          },
        });
      });

      it("adds error when correspondence town or city is less than 2 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "A",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_TOWN_OR_CITY_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when correspondence town or city exceeds max character length", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "a".repeat(101),
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_TOWN_OR_CITY_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when correspondence town or city contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London2",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          townOrCityInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_TOWN_OR_CITY_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when correspondence county is less than 3 characters when populated", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London",
          "correspondence-county": "AB",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          countyInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_COUNTY_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when correspondence county contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London",
          "correspondence-county": "Surrey2",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          countyInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_COUNTY_INVALID_CHARACTERS,
          },
        });
      });

      it("adds error when correspondence postcode is less than 5 characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "A1 1",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          postcodeInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_POSTCODE_MIN_MAX_LENGTH,
          },
        });
      });

      it("adds error when correspondence postcode contains invalid characters", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A-1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          postcodeInputError: {
            text: CLIENT_DETAILS_ERROR.CORRESPONDENCE_POSTCODE_INVALID_CHARACTERS,
          },
        });
      });

      it("returns no errors when correspondence required fields are valid", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "SW1A 1AA",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {});
      });

      it("returns no errors when optional correspondence fields are blank and values are within new rules", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1A",
          "correspondence-address-line-2": "",
          "correspondence-town-or-city": "Ly",
          "correspondence-county": "",
          "correspondence-postcode": "A1 1A",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {});
      });

      it("adds error when correspondence postcode is missing", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-address-line-1": "1 Acacia Avenue",
          "correspondence-town-or-city": "London",
          "correspondence-postcode": "",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceAddress(formBody);
        assert.deepEqual(errorSummaries, {
          postcodeInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_POSTCODE,
          },
        });
      });
    });

    describe("validateCorrespondenceRecipient", () => {
      it("adds error when no correspondence recipient option selected", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceRecipient(formBody);

        assert.deepEqual(errorSummaries, {
          noRadioSelected: {
            text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
          },
        });
      });

      it("adds error when person is selected without a person name", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-recipient": "PERSON",
          "correspondence-recipient-person-name": "",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceRecipient(formBody);

        assert.deepEqual(errorSummaries, {
          recipientPersonNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_RECIPIENT_PERSON_NAME,
          },
        });
      });

      it("adds error when organisation is selected without an organisation name", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-recipient": "ORGANISATION",
          "correspondence-recipient-organisation-name": "",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceRecipient(formBody);

        assert.deepEqual(errorSummaries, {
          recipientOrganisationNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME,
          },
        });
      });

      it("returns no errors when none is selected", () => {
        const formValidator = new ClientDetailsValidator();
        const formBody = {
          _csrf: "abcdefg",
          "correspondence-recipient": "NONE",
        };

        const errorSummaries =
          formValidator.validateCorrespondenceRecipient(formBody);

        assert.deepEqual(errorSummaries, {});
      });
    });
  });
});
