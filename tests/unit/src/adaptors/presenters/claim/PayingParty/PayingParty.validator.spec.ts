import { strict as assert } from "assert";
import { PayingPartyValidator } from "#src/adaptors/presenters/claim/PayingParty/PayingParty.validator.js";
import { PAYING_PARTY_ERROR } from "#src/infrastructure/locales/constants.js";

describe("PayingPartyValidator", () => {
  describe("validatePayingParty", () => {
    it("returns error when paying party is empty", () => {
      const validator = new PayingPartyValidator();

      const errorSummaries = validator.validatePayingParty({
        "paying-party": "",
      });

      assert.deepEqual(errorSummaries, {
        payingPartyInputError: {
          text: PAYING_PARTY_ERROR.MISSING_PAYING_PARTY,
        },
      });
    });

    it("returns empty error object when paying party is provided", () => {
      const validator = new PayingPartyValidator();

      const errorSummaries = validator.validatePayingParty({
        "paying-party": "Acme Ltd",
      });

      assert.deepEqual(errorSummaries, {});
    });
  });
});
