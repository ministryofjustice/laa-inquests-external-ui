import { strict as assert } from "assert";
import { CaseSearchFormatter } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.formatter.js";

describe("CaseSearchFormatter", () => {
  describe("formatCases", () => {
    it("maps case fields into named display objects", () => {
      const formatter = new CaseSearchFormatter();

      const rows = formatter.formatCases([
        {
          laaReference: 1,
          clientName: "Jane Smith",
          clientDateOfBirth: "2000-01-01",
          dateSubmitted: "2026-06-30T15:59:32.622897",
          firmName: "test firm",
          firmNumber: "0A123B",
          overallDecision: "GRANTED",
        },
      ]);

      assert.deepEqual(rows[0], {
        reference: "1",
        clientName: "Jane Smith",
        dateOfBirth: "01/01/2000",
        dateSubmitted: "30/06/2026",
        firmNameAndNumber: "test firm 0A123B",
        overallDecision: "GRANTED",
      });
    });

    it("shows only firm number when firm name is null", () => {
      const formatter = new CaseSearchFormatter();

      const rows = formatter.formatCases([
        {
          laaReference: 2,
          clientName: "John Doe",
          clientDateOfBirth: "1990-05-15",
          dateSubmitted: "2026-06-30T10:00:00.000000",
          firmName: null,
          firmNumber: "0B456C",
          overallDecision: "REFUSED",
        },
      ]);

      assert.equal(rows[0].firmNameAndNumber, "0B456C");
    });

    it("returns empty array when no cases", () => {
      const formatter = new CaseSearchFormatter();
      const rows = formatter.formatCases([]);
      assert.deepEqual(rows, []);
    });
  });
});
