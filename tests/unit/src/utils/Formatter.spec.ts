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
      expect(allProceedings.length).to.equal(10);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(10);
      expect(filteredList).to.deep.equal(allProceedings);
    });
    it("returns a filtered list of proceedings when one proceeding selected", () => {
      const formatter = new Formatter();
      const selectedProceedings = [
        {
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
      ];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(10);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(9);
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
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(10);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(8);
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
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
        {
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
      ];

      const allProceedings = PROCEEDING_OPTIONS;
      expect(allProceedings.length).to.equal(10);
      const filteredList = formatter.filterAvailableOptions(
        selectedProceedings,
        allProceedings,
      );
      expect(filteredList.length).to.equal(9);
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
      const selectedProceedings = [
        {
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
      ];

      const tableRows =
        formatter.formatSelectedIntoTableRows(selectedProceedings);

      expect(tableRows.length).to.equal(1);
      const [selectedRow] = tableRows;
      expect(selectedRow.key).to.deep.equal({ text: "CAPA" });
      expect(selectedRow.value).to.equal(undefined);
    });
    it("includes an actions property with a remove link for the selected proceeding", () => {
      const formatter = new Formatter();
      const selectedProceedings = [
        {
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
      ];

      const expectedActions = {
        items: [
          {
            href: "/apply/proceedings/remove?proceedingId=PC049",
            text: "Remove",
          },
        ],
      };

      const tableRows =
        formatter.formatSelectedIntoTableRows(selectedProceedings);

      expect(tableRows.length).to.equal(1);
      const [selectedRow] = tableRows;
      expect(selectedRow.actions).to.deep.equal(expectedActions);
    });
  });
  describe("formatOptionsIntoList", () => {
    it("return a list containing an options object with text equal to a proceedingDescription and value equal to proceedingId when one proceeding provided", () => {
      const formatter = new Formatter();
      const proceedinglist = [
        {
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
      ];

      const options = formatter.formatOptionsIntoList(proceedinglist);

      expect(options.length).to.equal(1);
      const [selectedOption] = options;
      expect(selectedOption.text).to.equal("CAPA");
      expect(selectedOption.value).to.equal("PC049");
    });
    it("returns multiple option objects with text equal to the proceedingDescription and value equal to proceedingIds", () => {
      const formatter = new Formatter();

      const allProceedings = PROCEEDING_OPTIONS;

      const options = formatter.formatOptionsIntoList(allProceedings);

      expect(options.length).to.equal(10);
      options.forEach((option, i) => {
        expect(option.text).to.equal(allProceedings[i].proceedingDescription);
        expect(option.value).to.equal(allProceedings[i].proceedingId);
      });
    });
  });
});
