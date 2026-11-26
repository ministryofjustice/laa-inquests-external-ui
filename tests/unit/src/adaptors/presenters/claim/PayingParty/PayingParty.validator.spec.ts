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

    it("returns missing error when paying party is only whitespace", () => {
      const validator = new PayingPartyValidator();

      const errorSummaries = validator.validatePayingParty({
        "paying-party": "   ",
      });

      assert.deepEqual(errorSummaries, {
        payingPartyInputError: {
          text: PAYING_PARTY_ERROR.MISSING_PAYING_PARTY,
        },
      });
    });

    [
      ["a formula", "=SUM(A1)"],
      ["angle brackets", "<b>Acme</b>"],
      ["a semicolon", "Acme;Ltd"],
      ["double quotes", 'Acme "Ltd"'],
      ["brackets", "Acme (UK) Ltd"],
      ["a newline", "Acme\nLtd"],
      ["a zero-width character", "Acme\u200bLtd"],
      ["only punctuation", "..."],
      ["only an ampersand", "&"],
    ].forEach(([reason, value]) => {
      it(`returns error when paying party contains ${reason}`, () => {
        const validator = new PayingPartyValidator();

        const errorSummaries = validator.validatePayingParty({
          "paying-party": value,
        });

        assert.deepEqual(errorSummaries, {
          payingPartyInputError: {
            text: PAYING_PARTY_ERROR.INVALID_PAYING_PARTY_CHARACTERS,
          },
        });
      });
    });

    [
      "Smith & Co. Solicitors, Ltd",
      "O'Brien-Jones LLP",
      "O\u2019Brien LLP",
      "Station 4 Legal",
      "3M",
      "Müller GmbH",
      "Mu\u0308ller GmbH",
      "  Acme Ltd  ",
      "a".repeat(100),
      `  ${"a".repeat(100)}  `,
    ].forEach((value) => {
      it(`returns no error for the paying party ${JSON.stringify(value.trim().slice(0, 30))}`, () => {
        const validator = new PayingPartyValidator();

        const errorSummaries = validator.validatePayingParty({
          "paying-party": value,
        });

        assert.deepEqual(errorSummaries, {});
      });
    });

    it("returns error when paying party exceeds 100 characters", () => {
      const validator = new PayingPartyValidator();

      const errorSummaries = validator.validatePayingParty({
        "paying-party": "a".repeat(101),
      });

      assert.deepEqual(errorSummaries, {
        payingPartyInputError: {
          text: PAYING_PARTY_ERROR.PAYING_PARTY_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });
  });
});
