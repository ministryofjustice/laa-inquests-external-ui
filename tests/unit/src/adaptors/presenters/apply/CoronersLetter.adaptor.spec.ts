import { StubbedInstance, stubInterface } from "ts-sinon";
import { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import { UploadCoronersLetterValidator } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.validator.js";
import { strict as assert } from "assert";
import type { Request, Response } from "express";
import { UploadCoronersLetterRequest } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/models/UploadCoronersLetter.types.js";
import { v4 as uuidv4 } from "uuid";
import { CORONERS_LETTER_ERROR } from "#src/infrastructure/locales/constants.js";

describe("Coroners Letter adaptor", () => {
  let coronersLetterAdaptor: CoronersLetterAdaptor;
  let requestStub: StubbedInstance<Request>;
  let responseStub: StubbedInstance<Response>;

  const testCoronersLetterId = uuidv4();
  const testCoronersLetterFileName = "test-coroners-letter.pdf";

  const uploadCoronersLetterPort = stubInterface<UploadCoronersLetterPort>();
  const uploadCoronersLetterValidator =
    stubInterface<UploadCoronersLetterValidator>();
  uploadCoronersLetterValidator.validateCoronersLetterUploadFile.returns({});
  uploadCoronersLetterPort.uploadCoronersLetter.resolves({
    status: "SUCCESS",
    coronersLetterId: testCoronersLetterId,
    coronersLetterFileName: testCoronersLetterFileName,
  });

  before(() => {
    coronersLetterAdaptor = new CoronersLetterAdaptor(
      uploadCoronersLetterValidator,
      uploadCoronersLetterPort,
    );
  });

  beforeEach(() => {
    requestStub = stubInterface<Request>();
    responseStub = stubInterface<Response>();
  });

  const setupRequestFile = (): Buffer<ArrayBuffer> => {
    const testBuffer = Buffer.from("test-file-content");
    requestStub.file = {
      buffer: testBuffer,
      mimetype: "application/pdf",
      originalname: testCoronersLetterFileName,
    } as Express.Multer.File;
    return testBuffer;
  };

  it("renders the coroners upload letter view with the correct arguments", () => {
    requestStub.session.coronersLetterFile = "test-file";
    coronersLetterAdaptor.renderUploadCoronersLetterForm(
      requestStub,
      responseStub,
    );

    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/upload-coroners-letter");
    assert.deepEqual(renderArgs[1], {
      csrfToken: responseStub.locals.csrfToken,
      uploadedFile: "test-file",
    });
  });

  it("saves the file and redirects on success", async () => {
    const buffer = setupRequestFile();
    requestStub.session.accessToken = "access-token-123";

    await coronersLetterAdaptor.processCoronersLetterUploadForm(
      requestStub,
      responseStub,
    );

    assert.equal(uploadCoronersLetterPort.uploadCoronersLetter.callCount, 1);

    const uploadBody = uploadCoronersLetterPort.uploadCoronersLetter.getCall(0)
      .args[0] as UploadCoronersLetterRequest;
    const uploadAccessToken =
      uploadCoronersLetterPort.uploadCoronersLetter.getCall(0).args[1];

    assert.deepEqual(uploadBody, {
      buffer: buffer,
      mimetype: "application/pdf",
      originalname: testCoronersLetterFileName,
    });
    assert.equal(uploadAccessToken, "access-token-123");

    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(redirectArgs[0], "/apply/check-your-answers");
  });

  it("saves the letter id and a file name to session on successful upload", async () => {
    setupRequestFile();

    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "SUCCESS",
      coronersLetterId: testCoronersLetterId,
      coronersLetterFileName: testCoronersLetterFileName,
    });

    await coronersLetterAdaptor.processCoronersLetterUploadForm(
      requestStub,
      responseStub,
    );

    assert.equal(requestStub.session.coronersLetterId, testCoronersLetterId);
    assert.equal(
      requestStub.session.coronersLetterFileName,
      testCoronersLetterFileName,
    );
  });

  describe("when the file validation fails", () => {
    afterEach(() => {
      uploadCoronersLetterValidator.validateCoronersLetterUploadFile.returns(
        {},
      );
    });

    it("re-renders the form with error summaries when no file is chosen", async () => {
      uploadCoronersLetterValidator.validateCoronersLetterUploadFile.returns({
        coronersLetterError: { text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
      });

      await coronersLetterAdaptor.processCoronersLetterUploadForm(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/upload-coroners-letter");
      assert.deepEqual(renderArgs[1], {
        csrfToken: responseStub.locals.csrfToken,
        errorSummaries: {
          coronersLetterError: { text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
        },
      });
    });
  });

  it("re-renders the form with error summaries when file chosen exceeds 10 MB", async () => {
    uploadCoronersLetterValidator.validateCoronersLetterUploadFile.returns({
      coronersLetterError: { text: CORONERS_LETTER_ERROR.FILE_TOO_LARGE },
    });

    await coronersLetterAdaptor.processCoronersLetterUploadForm(
      requestStub,
      responseStub,
    );

    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/upload-coroners-letter");
    assert.deepEqual(renderArgs[1], {
      csrfToken: responseStub.locals.csrfToken,
      errorSummaries: {
        coronersLetterError: { text: CORONERS_LETTER_ERROR.FILE_TOO_LARGE },
      },
    });
  });

  describe("when the upload fails", () => {
    it("renders the 503 error page when the response status is not SUCCESS", async () => {
      setupRequestFile();
      responseStub.status.returns(responseStub);
      uploadCoronersLetterPort.uploadCoronersLetter.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "UPSTREAM_REJECTED",
      });

      await coronersLetterAdaptor.processCoronersLetterUploadForm(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.status.calledWith(503), true);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "main/error");
      assert.deepEqual(renderArgs[1], {
        status: "503",
        error: "Service unavailable. Please try again later.",
      });
      assert.equal(responseStub.redirect.callCount, 0);
    });
  });
});
