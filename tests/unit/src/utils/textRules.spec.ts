import { expect } from "chai";
import {
  hasUnsafeProseCharacters,
  isOrganisationName,
  isPersonName,
  normaliseFreeText,
} from "#src/utils/textRules.js";

interface TextCase {
  value: string;
  reason: string;
}

describe("normaliseFreeText()", () => {
  it("trims leading and trailing whitespace, including newlines", () => {
    expect(normaliseFreeText("  Smith \n")).to.equal("Smith");
  });

  it("folds curly apostrophes to a straight apostrophe", () => {
    expect(normaliseFreeText("O\u2019Donald \u2018x")).to.equal("O'Donald 'x");
  });

  it("composes an accent typed as a separate mark", () => {
    expect(normaliseFreeText("Jose\u0301")).to.equal("Jos\u00e9");
  });

  it("leaves text inside the value unchanged", () => {
    expect(normaliseFreeText("line one\nline  two")).to.equal(
      "line one\nline  two",
    );
  });
});

describe("isPersonName()", () => {
  const valid: TextCase[] = [
    { value: "Smith", reason: "plain letters" },
    { value: "O'Donald", reason: "a straight apostrophe" },
    { value: "O\u2019Donald", reason: "a curly apostrophe" },
    { value: "Mary-Jane", reason: "a hyphen" },
    { value: "Jean Luc", reason: "a space" },
    { value: "Jos\u00e9", reason: "a composed accent" },
    { value: "Jose\u0301", reason: "an accent typed as a separate mark" },
    { value: "Si\u00e2n", reason: "a circumflex" },
    { value: "G\u0175yn", reason: "a letter with no unaccented form" },
    { value: "\u0141ukasz", reason: "a letter not covered by accent folding" },
    { value: "\u674e\u660e", reason: "non-Latin letters" },
    { value: "  Smith  ", reason: "surrounding whitespace (trimmed)" },
  ];

  const invalid: TextCase[] = [
    { value: "", reason: "empty" },
    { value: "   ", reason: "only spaces" },
    { value: "=cmd", reason: "a formula prefix" },
    { value: "+441234", reason: "a plus prefix" },
    { value: "@user", reason: "an at prefix" },
    { value: "-Smith", reason: "a leading hyphen" },
    { value: "'Smith", reason: "a leading apostrophe" },
    { value: "Smith1", reason: "a digit" },
    { value: "Smith.", reason: "a full stop" },
    { value: "Smith & Co", reason: "an ampersand" },
    { value: "<script>alert(1)</script>", reason: "angle brackets" },
    { value: "Smith;DROP", reason: "a semicolon" },
    { value: 'Smith"', reason: "a double quote" },
    { value: "Smith\nJones", reason: "an embedded newline" },
    { value: "Smith\u0000", reason: "a control character" },
    { value: "Smi\u200bth", reason: "a zero-width character" },
    { value: "\u0301", reason: "a combining mark with no letter" },
  ];

  valid.forEach(({ value, reason }) => {
    it(`accepts ${reason}`, () => {
      expect(isPersonName(value)).to.equal(true);
    });
  });

  invalid.forEach(({ value, reason }) => {
    it(`rejects ${reason}`, () => {
      expect(isPersonName(value)).to.equal(false);
    });
  });
});

describe("isOrganisationName()", () => {
  const valid: TextCase[] = [
    {
      value: "Smith & Co. Solicitors, Ltd",
      reason: "ampersand, full stop and comma",
    },
    { value: "O'Brien-Jones LLP", reason: "an apostrophe and hyphen" },
    { value: "Station 4 Legal", reason: "a digit" },
    { value: "3M", reason: "a name starting with a digit" },
    { value: "M\u00fcller GmbH", reason: "an accented letter" },
    {
      value: "Mu\u0308ller GmbH",
      reason: "an accent typed as a separate mark",
    },
    { value: "Smith \u2019n Co", reason: "a curly apostrophe" },
  ];

  const invalid: TextCase[] = [
    { value: "", reason: "empty" },
    { value: "...", reason: "punctuation only" },
    { value: "&", reason: "an ampersand only" },
    { value: "=SUM(A1)", reason: "a formula" },
    { value: "<b>Smith</b>", reason: "angle brackets" },
    { value: "Smith;Co", reason: "a semicolon" },
    { value: 'Smith "Co"', reason: "double quotes" },
    { value: "Smith\nCo", reason: "an embedded newline" },
    { value: "Smith\u0000Co", reason: "a control character" },
    { value: "\u0301Smith", reason: "a leading combining mark" },
  ];

  valid.forEach(({ value, reason }) => {
    it(`accepts ${reason}`, () => {
      expect(isOrganisationName(value)).to.equal(true);
    });
  });

  invalid.forEach(({ value, reason }) => {
    it(`rejects ${reason}`, () => {
      expect(isOrganisationName(value)).to.equal(false);
    });
  });
});

describe("hasUnsafeProseCharacters()", () => {
  const safe: TextCase[] = [
    { value: "", reason: "empty text" },
    { value: "Plain sentence.", reason: "plain text" },
    { value: "Line one\nline two\r\nline three", reason: "line breaks" },
    { value: "Column\tone", reason: "a tab" },
    {
      value: "Tom & Jerry's \"quote\"; =+@ (see 'notes') #1 100%",
      reason: "punctuation and formula characters",
    },
    { value: "Jos\u00e9 \u674e\u660e", reason: "accented and non-Latin text" },
  ];

  const unsafe: TextCase[] = [
    { value: "a < b", reason: "a less-than sign" },
    { value: "a > b", reason: "a greater-than sign" },
    { value: "<script>alert(1)</script>", reason: "a script tag" },
    { value: "bell\u0007", reason: "a control character" },
    { value: "null\u0000byte", reason: "a null byte" },
    { value: "escape\u001b[31m", reason: "an escape sequence" },
    { value: "zero\u200bwidth", reason: "a zero-width space" },
    { value: "\u202etxt.exe", reason: "a right-to-left override" },
  ];

  safe.forEach(({ value, reason }) => {
    it(`allows ${reason}`, () => {
      expect(hasUnsafeProseCharacters(value)).to.equal(false);
    });
  });

  unsafe.forEach(({ value, reason }) => {
    it(`flags ${reason}`, () => {
      expect(hasUnsafeProseCharacters(value)).to.equal(true);
    });
  });
});
