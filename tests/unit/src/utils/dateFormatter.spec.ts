import { expect } from "chai";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";

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
