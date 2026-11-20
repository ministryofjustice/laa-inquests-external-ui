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
          text: "Select a file",
        },
      });
    });

    it("returns only-one-file error when a coroner's letter is already uploaded", () => {
      const validator = new UploadCoronersLetterValidator();
      const validFile = {
        size: 5 * 1024 * 1024,
        mimetype: validMimeType,
      } as Express.Multer.File;

      const errorSummaries = validator.validateCoronersLetterUploadFile(
        validFile,
        "existing-coroners-letter-id",
      );

      assert.deepEqual(errorSummaries, {
        coronersLetterError: {
          text: "You can only upload one file. Delete the existing file before uploading a new one",
        },
      });
    });

    describe("when file has a valid type", () => {
      it("returns expected error when file size is 0", () => {
        const validator = new UploadCoronersLetterValidator();
        const undersizedFile = {
          size: 0,
          mimetype: validMimeType,
          originalname: "coroners-letter.pdf",
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(undersizedFile);

        assert.deepEqual(errorSummaries, {
          coronersLetterError: {
            text: "coroners-letter.pdf is empty",
          },
        });
      });

      it("returns expected error when file exceeds 10MB", () => {
        const validator = new UploadCoronersLetterValidator();
        const oversizedFile = {
          size: 11 * 1024 * 1024,
          mimetype: validMimeType,
          originalname: "coroners-letter.pdf",
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(oversizedFile);

        assert.deepEqual(errorSummaries, {
          coronersLetterError: {
            text: "coroners-letter.pdf must be smaller than 10MB",
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

      it("returns no errors when file name contains accepted punctuation", () => {
        const validator = new UploadCoronersLetterValidator();
        const validFile = {
          size: 5 * 1024 * 1024,
          mimetype: validMimeType,
          originalname: "coroners-letter! (final).pdf",
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(validFile);

        assert.deepEqual(errorSummaries, {});
      });

      for (const originalname of [
        "<img src=x onerror=alert(1)>.pdf",
        "letter'\".pdf",
        "C:\\fakepath\\letter.pdf",
        "..\\letter.pdf",
        "letter.pdf\n",
        "létter.pdf",
        "",
      ]) {
        it(`rejects the file name ${JSON.stringify(originalname)} even though the request bypassed the browser`, () => {
          const validator = new UploadCoronersLetterValidator();
          const file = {
            size: 5 * 1024 * 1024,
            mimetype: validMimeType,
            originalname,
          } as Express.Multer.File;

          const errorSummaries =
            validator.validateCoronersLetterUploadFile(file);

          assert.deepEqual(errorSummaries, {
            coronersLetterError: {
              text: `${originalname} has an invalid filename. Filenames should only include the letters a-z and A-Z, numbers 0-9, spaces, and the characters .!()_-`,
            },
          });
        });
      }
    });

    describe("when file has an invalid type", () => {
      it("names the invalid file and returns the type error before the size error", () => {
        const validator = new UploadCoronersLetterValidator();
        const oversizedFile = {
          size: 11 * 1024 * 1024,
          mimetype: invalidMimeType,
          originalname: "file1.exe",
        } as Express.Multer.File;

        const errorSummaries =
          validator.validateCoronersLetterUploadFile(oversizedFile);

        assert.deepEqual(errorSummaries, {
          coronersLetterError: {
            text: "file1.exe must be a JPG, PNG, BMP or PDF",
          },
        });
      });
    });
  });
});
