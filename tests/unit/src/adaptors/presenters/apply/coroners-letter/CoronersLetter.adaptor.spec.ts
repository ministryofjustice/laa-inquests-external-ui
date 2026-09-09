import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import type { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import type { DeleteCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/DeleteCoronersLetter.useCase.js";
import type { UploadCoronersLetterValidator } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.validator.js";
import {
  CORONERS_LETTER_ERROR,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";

describe("Coroners Letter adaptor", () => {
  let uploadCoronersLetterUseCase: StubbedInstance<UploadCoronersLetterUseCase>;
  let deleteCoronersLetterUseCase: StubbedInstance<DeleteCoronersLetterUseCase>;
  let formValidator: StubbedInstance<UploadCoronersLetterValidator>;

  const testCoronersLetterId = uuidv4();
  const testCoronersLetterFileName = "test-coroners-letter.pdf";

  beforeEach(() => {
    uploadCoronersLetterUseCase = stubInterface<UploadCoronersLetterUseCase>();
    deleteCoronersLetterUseCase = stubInterface<DeleteCoronersLetterUseCase>();
    formValidator = stubInterface<UploadCoronersLetterValidator>();
    formValidator.validateCoronersLetterSelection.returns({});
    formValidator.validateCoronersLetterUploadFile.returns({});
  });

  function buildAdaptor(): CoronersLetterAdaptor {
    return new CoronersLetterAdaptor(
      formValidator,
      uploadCoronersLetterUseCase,
      deleteCoronersLetterUseCase,
    );
  }

  function buildFile(): Express.Multer.File {
    return {
      buffer: Buffer.from("test-file-content"),
      mimetype: "application/pdf",
      originalname: testCoronersLetterFileName,
      size: 17,
    } as Express.Multer.File;
  }

  describe("renderUploadCoronersLetterForm", () => {
    it("renders the view with no uploaded file and the default back link", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderUploadCoronersLetterForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];
      assert.equal(view, "apply/upload-coroners-letter");
      assert.equal(viewModel.csrfToken, "test-token");
      assert.deepEqual(viewModel.uploadedFiles, []);
      assert.equal(viewModel.backHref, "/apply/public-authority");
    });

    it("renders the uploaded file from session for the multi file upload widget", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.coronersLetterId = testCoronersLetterId;
      requestStub.session.coronersLetterFileName = testCoronersLetterFileName;

      adaptor.renderUploadCoronersLetterForm(requestStub, responseStub);

      const [, viewModel] = responseStub.render.getCall(0).args as unknown as [
        string,
        Record<string, unknown>,
      ];
      assert.deepEqual(viewModel.uploadedFiles, [
        {
          message: { text: testCoronersLetterFileName },
          fileName: testCoronersLetterId,
          originalFileName: testCoronersLetterFileName,
          deleteButton: { text: "Delete" },
        },
      ]);
    });

    it("captures check-your-answers origin and sets the check-your-answers back link", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.query = { from: "check-your-answers" };

      adaptor.renderUploadCoronersLetterForm(requestStub, responseStub);

      assert.equal(requestStub.session.returnToApplyCheckYourAnswers, true);
      const [, viewModel] = responseStub.render.getCall(0).args as unknown as [
        string,
        Record<string, unknown>,
      ];
      assert.equal(viewModel.backHref, "/apply/check-your-answers");
    });
  });

  describe("processCoronersLetterContinue", () => {
    it("re-renders with errors when no coroner's letter has been uploaded", () => {
      formValidator.validateCoronersLetterSelection.returns({
        coronersLetterError: { text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.processCoronersLetterContinue(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];
      assert.equal(view, "apply/upload-coroners-letter");
      assert.deepEqual(viewModel.errorSummaries, {
        coronersLetterError: { text: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
      });
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("redirects to check your answers when a coroner's letter has been uploaded", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.coronersLetterId = testCoronersLetterId;
      requestStub.session.returnToApplyCheckYourAnswers = true;

      adaptor.processCoronersLetterContinue(requestStub, responseStub);

      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/apply/check-your-answers",
      );
      assert.equal(
        requestStub.session.returnToApplyCheckYourAnswers,
        undefined,
      );
    });
  });

  describe("processCoronersLetterUpload", () => {
    it("returns a validation error as JSON when the file is invalid", async () => {
      formValidator.validateCoronersLetterUploadFile.returns({
        coronersLetterError: { text: CORONERS_LETTER_ERROR.INVALID_FILE_TYPE },
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);
      requestStub.file = buildFile();

      await adaptor.processCoronersLetterUpload(requestStub, responseStub);

      assert.equal(
        responseStub.status.getCall(0).args[0],
        HTTP_UNPROCESSABLE_CONTENT,
      );
      assert.equal(
        (responseStub.json.getCall(0).args[0] as { error: { message: string } })
          .error.message,
        CORONERS_LETTER_ERROR.INVALID_FILE_TYPE,
      );
    });

    it("stores the uploaded letter in session and returns 201 on success", async () => {
      uploadCoronersLetterUseCase.execute.resolves({
        status: "SUCCESS",
        data: {
          coronersLetterId: testCoronersLetterId,
          coronersLetterFileName: testCoronersLetterFileName,
        },
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);
      requestStub.file = buildFile();
      requestStub.session.save = ((callback: (err?: Error) => void): void => {
        callback();
      }) as Request["session"]["save"];

      await adaptor.processCoronersLetterUpload(requestStub, responseStub);

      assert.equal(responseStub.status.getCall(0).args[0], HTTP_CREATED);
      assert.equal(requestStub.session.coronersLetterId, testCoronersLetterId);
      assert.equal(
        requestStub.session.coronersLetterFileName,
        testCoronersLetterFileName,
      );
    });

    it("returns a service unavailable error when the upload fails", async () => {
      uploadCoronersLetterUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "UPSTREAM_REJECTED",
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);
      requestStub.file = buildFile();

      await adaptor.processCoronersLetterUpload(requestStub, responseStub);

      assert.equal(
        responseStub.status.getCall(0).args[0],
        HTTP_SERVICE_UNAVAILABLE,
      );
    });

    it("returns the virus error message as JSON when the scan is positive", async () => {
      uploadCoronersLetterUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "FILE_SCAN_FOUND_VIRUS",
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);
      requestStub.file = buildFile();

      await adaptor.processCoronersLetterUpload(requestStub, responseStub);

      assert.equal(
        (responseStub.json.getCall(0).args[0] as { error: { message: string } })
          .error.message,
        CORONERS_LETTER_ERROR.FILE_SCAN_FOUND_VIRUS,
      );
    });
  });

  describe("processCoronersLetterDelete", () => {
    it("returns 400 when no file identifier is provided", async () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.status.returns(responseStub);
      requestStub.body = {};

      await adaptor.processCoronersLetterDelete(requestStub, responseStub);

      assert.equal(responseStub.status.getCall(0).args[0], HTTP_BAD_REQUEST);
    });

    it("clears the session and returns success when the delete succeeds", async () => {
      deleteCoronersLetterUseCase.execute.resolves({ status: "SUCCESS" });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.status.returns(responseStub);
      requestStub.body = { delete: testCoronersLetterId };
      requestStub.session.coronersLetterId = testCoronersLetterId;
      requestStub.session.coronersLetterFileName = testCoronersLetterFileName;

      await adaptor.processCoronersLetterDelete(requestStub, responseStub);

      assert.deepEqual(deleteCoronersLetterUseCase.execute.getCall(0).args[0], {
        coronersLetterId: testCoronersLetterId,
        accessToken: undefined,
      });
      assert.equal(requestStub.session.coronersLetterId, undefined);
      assert.equal(requestStub.session.coronersLetterFileName, undefined);
      assert.equal(responseStub.json.getCall(0).args[0].success, true);
    });
  });
});
