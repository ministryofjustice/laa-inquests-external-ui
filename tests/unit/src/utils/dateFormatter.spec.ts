import { expect } from "chai";
import {
  formatDateDDMMYYYY,
  formatDateISOYYYYMMDD,
  formatISODateDDMMYYYY,
} from "#src/utils/dateFormatter.js";

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

describe("formatDateISOYYYYMMDD()", () => {
  it("formats year, month, and day into YYYY-MM-DD ISO format", () => {
    expect(formatDateISOYYYYMMDD("1989", "10", "05")).to.equal("1989-10-05");
    expect(formatDateISOYYYYMMDD("1975", "02", "01")).to.equal("1975-02-01");
    expect(formatDateISOYYYYMMDD("2024", "3", "9")).to.equal("2024-03-09");
  });
});

describe("formatISODateDDMMYYYY()", () => {
  it("formats a YYYY-MM-DD ISO date string into dd/mm/yyyy", () => {
    expect(formatISODateDDMMYYYY("2000-01-01")).to.equal("01/01/2000");
    expect(formatISODateDDMMYYYY("2026-03-21")).to.equal("21/03/2026");
    expect(formatISODateDDMMYYYY("1990-12-05")).to.equal("05/12/1990");
  });

  it("formats an ISO datetime string by using only the date part", () => {
    expect(formatISODateDDMMYYYY("2026-06-30T15:59:32.622897")).to.equal(
      "30/06/2026",
    );
    expect(formatISODateDDMMYYYY("2026-01-01T00:00:00.000000")).to.equal(
      "01/01/2026",
    );
  });

  it("returns the raw string for non-ISO date formats", () => {
    expect(formatISODateDDMMYYYY("23-09-1977")).to.equal("23-09-1977");
    expect(formatISODateDDMMYYYY("09/23/1977")).to.equal("09/23/1977");
    expect(formatISODateDDMMYYYY("not-a-date")).to.equal("not-a-date");
    expect(formatISODateDDMMYYYY("")).to.equal("");
  });
});
