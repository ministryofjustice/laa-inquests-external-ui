import { PROCEEDING_OPTIONS } from "#src/infrastructure/locales/constants.js";
import { Formatter } from "#src/utils/Formatter.js";
import { expect } from "chai";

describe("Formatter", () => {
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
    it("returns the proceeding ID and description text items on the key and value properties of the returned row object", () => {
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
      expect(selectedRow.key).to.deep.equal({ text: "PC049" });
      expect(selectedRow.value).to.deep.equal({ text: "CAPA" });
    });
    it("includes an actions property on the returned row object with a text value of 'Remove'", () => {
      const formatter = new Formatter();
      const selectedProceedings = [
        {
          proceedingId: "PC049",
          proceedingDescription: "CAPA",
          matterType: "INQUEST",
        },
      ];

      const expectedActions = { items: [{ text: "Remove" }] };

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
