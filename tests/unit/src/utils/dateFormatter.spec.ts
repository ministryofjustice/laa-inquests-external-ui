import { expect } from "chai";
import { formatDate, formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";

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

describe("formatDateDDMMYYYY()", () => {
  it("formats valid year, month, and day into dd-MM-YYYY format", () => {
    expect(formatDateDDMMYYYY("2023", "07", "28")).to.equal("28-07-2023");
    expect(formatDateDDMMYYYY("1990", "01", "01")).to.equal("01-01-1990");
    expect(formatDateDDMMYYYY("2024", "12", "5")).to.equal("05-12-2024");
  });

  it("handles non-string inputs by converting them to strings and padding", () => {
    expect(formatDateDDMMYYYY(2023, 7, 28)).to.equal("28-07-2023");
    expect(formatDateDDMMYYYY(null, null, null)).to.equal("null-null-null");
    expect(formatDateDDMMYYYY(undefined, undefined, undefined)).to.equal(
      "undefined-undefined-undefined",
    );
  });
});
