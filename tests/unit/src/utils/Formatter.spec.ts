import { PROCEEDING_OPTIONS } from "#src/infrastructure/locales/constants.js";
import { Formatter } from "#src/utils/Formatter.js";
import { expect } from "chai";

describe("Formatter", () => {
  describe("formatCurrency", () => {
    it("formats a numeric string as GBP currency", () => {
      const formatter = new Formatter();

      const formattedValue = formatter.formatCurrency("1200");

      expect(formattedValue).to.equal("£1,200.00");
    });

    it("returns an empty string when the input is missing or invalid", () => {
      const formatter = new Formatter();

      expect(formatter.formatCurrency(undefined)).to.equal("");
      expect(formatter.formatCurrency("not-a-number")).to.equal("");
    });
  });

  describe("filterAvailableOptions", () => {
    it("returns a full list of proceedings when no proceedings selected", () => {
      const formatter = new Formatter();
      const selectedProceedings: [] = [];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(12);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(12);
      expect(filteredList).to.deep.equal(allProceedings);
    });
    it("returns a filtered list of proceedings when one proceeding selected", () => {
      const formatter = new Formatter();
      const selectedProceedings = [
        {
          proceedingId: "IQPC",
          proceedingName: "Death in police custody",
          matterType: "INQUEST",
        },
      ];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(12);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(11);
      filteredList.forEach((proceeding) => {
        expect(proceeding.proceedingId).not.to.equal(
          selectedProceedings[0].proceedingId,
        );
      });
    });
    it("returns a filtered list of proceedings when multiple proceedings selected", () => {
      const formatter = new Formatter();
      const selectedProceedings = [
        {
          proceedingId: "IQPC",
          proceedingName: "Death in police custody",
          matterType: "INQUEST",
        },
        {
          proceedingId: "IQPO",
          proceedingName: "Death in prison",
          matterType: "INQUEST",
        },
      ];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(12);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(10);
      filteredList.forEach((proceeding) => {
        expect(proceeding.proceedingId).not.to.equal(
          selectedProceedings[0].proceedingId,
        );
        expect(proceeding.proceedingId).not.to.equal(
          selectedProceedings[1].proceedingId,
        );
      });
    });
    it("filters out duplicate values", () => {
      const formatter = new Formatter();
      const selectedProceedings = [
        {
          proceedingId: "IQPC",
          proceedingName: "Death in police custody",
          matterType: "INQUEST",
        },
        {
          proceedingId: "IQPC",
          proceedingName: "Death in police custody",
          matterType: "INQUEST",
        },
      ];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(12);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(11);
      filteredList.forEach((proceeding) => {
        expect(proceeding.proceedingId).not.to.equal(
          selectedProceedings[0].proceedingId,
        );
      });
    });
  });
  describe("formatSelectedIntoTableRows", () => {
    it("returns the proceeding description text in the key property of the returned row object", () => {
      const formatter = new Formatter();
      const selectedProceeding = {
        proceedingId: "IQPC",
        proceedingName: "Death in police custody",
        matterType: "INQUEST",
      };

      const tableRows =
        formatter.formatSelectedIntoTableRows(selectedProceeding);

      expect(tableRows.length).to.equal(1);
      const [selectedRow] = tableRows;
      expect(selectedRow.key).to.deep.equal({
        text: "Death in police custody",
      });
      expect(selectedRow.value).to.equal(undefined);
    });
    it("does not include an actions property (no remove link)", () => {
      const formatter = new Formatter();
      const selectedProceeding = {
        proceedingId: "IQPC",
        proceedingName: "Death in police custody",
        matterType: "INQUEST",
      };

      const tableRows =
        formatter.formatSelectedIntoTableRows(selectedProceeding);

      expect(tableRows.length).to.equal(1);
      const [selectedRow] = tableRows;
      expect(selectedRow.actions).to.equal(undefined);
    });
  });
  describe("formatOptionsIntoList", () => {
    it("return a list containing an options object with text equal to a proceedingName and value equal to proceedingId when one proceeding provided", () => {
      const formatter = new Formatter();
      const proceedinglist = [
        {
          proceedingId: "IQPC",
          proceedingName: "Death in police custody",
          matterType: "INQUEST",
        },
      ];

      const options = formatter.formatOptionsIntoList(proceedinglist);

      expect(options.length).to.equal(1);
      const [selectedOption] = options;
      expect(selectedOption.text).to.equal("Death in police custody");
      expect(selectedOption.value).to.equal("IQPC");
    });
    it("returns multiple option objects with text equal to the proceedingName and value equal to proceedingIds", () => {
      const formatter = new Formatter();

      const allProceedings = PROCEEDING_OPTIONS;

      const options = formatter.formatOptionsIntoList(allProceedings);

      expect(options.length).to.equal(12);
      options.forEach((option, i) => {
        expect(option.text).to.equal(allProceedings[i].proceedingName);
        expect(option.value).to.equal(allProceedings[i].proceedingId);
      });
    });
  });
});
