import { expect } from "chai";
import { formatDateDDMMYYYY, formatISODateDDMMYYYY } from "#src/utils/dateFormatter.js";

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

describe("formatISODateDDMMYYYY()", () => {
  it("formats a YYYY-MM-DD ISO date string into dd/mm/yyyy", () => {
    expect(formatISODateDDMMYYYY("2000-01-01")).to.equal("01/01/2000");
    expect(formatISODateDDMMYYYY("2026-03-21")).to.equal("21/03/2026");
    expect(formatISODateDDMMYYYY("1990-12-05")).to.equal("05/12/1990");
  });

  it("formats an ISO datetime string by using only the date part", () => {
    expect(formatISODateDDMMYYYY("2026-06-30T15:59:32.622897")).to.equal("30/06/2026");
    expect(formatISODateDDMMYYYY("2026-01-01T00:00:00.000000")).to.equal("01/01/2026");
  });
});
