import { strict as assert } from "assert";
import { FinalBillTemplateValidator } from "#src/adaptors/presenters/claim/FinalBillTemplate/FinalBillTemplate.validator.js";
import { CLAIM_FINAL_BILL_TEMPLATE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FinalBillTemplateValidator", () => {
  describe("validateTemplateSelection", () => {
    it("returns error when no template has been uploaded", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateSelection(undefined);

      assert.deepEqual(result, {
        templateError: {
          text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_REQUIRED,
        },
      });
    });

    it("returns no error when a template has been uploaded", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateSelection({
        costTemplateId: "template-id-123",
        costTemplateFilename: "cost-template.xlsx",
      });

      assert.deepEqual(result, {});
    });
  });

  describe("validateTemplateUploadFile", () => {
    it("returns error when no file is chosen", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateUploadFile(undefined);

      assert.deepEqual(result, {
        templateError: { text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.NO_FILE_CHOSEN },
      });
    });

    it("returns error when the file type is not an excel spreadsheet", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateUploadFile({
        mimetype: "application/pdf",
        size: 100,
      } as Express.Multer.File);

      assert.deepEqual(result, {
        templateError: {
          text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.INVALID_FILE_TYPE,
        },
      });
    });

    it("returns error when the file is larger than 10MB", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateUploadFile({
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 10485761,
      } as Express.Multer.File);

      assert.deepEqual(result, {
        templateError: {
          text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_TOO_LARGE,
        },
      });
    });

    it("returns error when the file is empty", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateUploadFile({
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 0,
      } as Express.Multer.File);

      assert.deepEqual(result, {
        templateError: { text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_IS_EMPTY },
      });
    });

    it("returns no error for a valid xlsx file", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateUploadFile({
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 100,
      } as Express.Multer.File);

      assert.deepEqual(result, {});
    });

    it("returns no error for a valid legacy xls file", () => {
      const validator = new FinalBillTemplateValidator();

      const result = validator.validateTemplateUploadFile({
        mimetype: "application/vnd.ms-excel",
        size: 100,
      } as Express.Multer.File);

      assert.deepEqual(result, {});
    });
  });
});
