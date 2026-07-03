import { UploadCoronersLetterValidator } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.validator.js";
import { assert } from "chai";

describe("UploadCoronersLetterValidator", () => {
  describe("validateCoronersLetterUploadFile", () => {
    const validMimeType = "image/jpeg";
    const invalidMimeType = "audio/mpeg";

    it("returns expected error when no file is provided", () => {
      const validator = new UploadCoronersLetterValidator();

      const errorSummaries =
        validator.validateCoronersLetterUploadFile(undefined);

      assert.deepEqual(errorSummaries, {
        coronersLetterError: {
          text: "Please choose a file",
        },
      });
    });

    describe("when file has a valid type", () => {
      it("returns expected error when file size is 0", () => {
        const validator = new UploadCoronersLetterValidator();
        const undersizedFile = {
          size: 0,
          mimetype: validMimeType,
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(undersizedFile);

        assert.deepEqual(errorSummaries, {
          coronersLetterError: {
            text: "File must not be empty",
          },
        });
      });

      it("returns expected error when file exceeds 10MB", () => {
        const validator = new UploadCoronersLetterValidator();
        const oversizedFile = {
          size: 11 * 1024 * 1024,
          mimetype: validMimeType,
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(oversizedFile);

        assert.deepEqual(errorSummaries, {
          coronersLetterError: {
            text: "File size must not exceed 10MB",
          },
        });
      });

      it("returns no errors when file is within size limit", () => {
        const validator = new UploadCoronersLetterValidator();
        const validFile = {
          size: 5 * 1024 * 1024,
          mimetype: validMimeType,
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(validFile);

        assert.deepEqual(errorSummaries, {});
      });
    });

    describe("when file has an invalid type", () => {
      it("returns file type error first when file exceeds 10MB", () => {
        const validator = new UploadCoronersLetterValidator();
        const oversizedFile = {
          size: 11 * 1024 * 1024,
          mimetype: invalidMimeType,
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(oversizedFile);

        assert.deepEqual(errorSummaries, {
          coronersLetterError: {
            text: "File type must be JPG, PNG, BMP or PDF",
          },
        });
      });
    });
  });
});
