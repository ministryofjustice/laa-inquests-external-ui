import { expect } from "chai";
import { formatDate, formatDateISO8601 } from "#src/utils/dateFormatter.js";

describe("formatDate()", () => {
  it("formats a valid ISO date string correctly", () => {
    expect(formatDate("1986-01-06T00:00:00Z")).to.equal("6 Jan 1986");
    expect(formatDate("2023-07-28")).to.equal("28 Jul 2023");
  });

  it("formats dates with single-digit days without leading zero", () => {
    expect(formatDate("2023-02-05")).to.equal("5 Feb 2023");
  });

  it("handles invalid date strings by returning the original input", () => {
    expect(formatDate("invalid-date")).to.equal("invalid-date");
    expect(formatDate("")).to.equal("");
  });
});

describe("formatDateISO8601()", () => {
  it("formats valid year, month, and day into ISO 8601 format", () => {
    expect(formatDateISO8601("2023", "07", "28")).to.equal("2023-07-28");
  });

  it("handles non-string inputs by treating them as empty strings", () => {
    expect(formatDateISO8601(2023, 7, 28)).to.equal("--");
    expect(formatDateISO8601(null, null, null)).to.equal("--");
    expect(formatDateISO8601(undefined, undefined, undefined)).to.equal("--");
  });
});
