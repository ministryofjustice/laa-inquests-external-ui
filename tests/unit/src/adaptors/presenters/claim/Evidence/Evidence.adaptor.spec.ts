import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";
import type { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";
import type { UploadEvidenceValidator } from "#src/adaptors/presenters/claim/Evidence/Evidence.validator.js";
import {
  CLAIM_EVIDENCE_ERROR,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";

describe("Evidence adaptor", () => {
  let uploadEvidenceUseCase: StubbedInstance<UploadEvidenceUseCase>;
  let uploadEvidenceValidator: StubbedInstance<UploadEvidenceValidator>;

  beforeEach(() => {
    uploadEvidenceUseCase = stubInterface<UploadEvidenceUseCase>();
    uploadEvidenceValidator = stubInterface<UploadEvidenceValidator>();
    uploadEvidenceValidator.validateEvidenceSelection.returns({});
    uploadEvidenceValidator.validateEvidenceUploadFile.returns({});
  });

  describe("renderForm", () => {
    it("renders the evidence view", () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/evidence");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.deepEqual(viewModel.uploadedFiles, []);
    });

    it("renders evidence file name from session after refresh", () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        evidenceFiles: [
          {
            id: "file-id-123",
            fileName: "test-evidence.pdf",
          },
        ],
      };

      adaptor.renderForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(viewModel.uploadedFiles, [
        {
          message: { text: "test-evidence.pdf" },
          fileName: "file-id-123",
          originalFileName: "test-evidence.pdf",
          deleteButton: { text: "Delete" },
        },
      ]);
    });
  });

  describe("processForm", () => {
    it("re-renders evidence page with error summary when no evidence file is in session", () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "csrf-token" };

      uploadEvidenceValidator.validateEvidenceSelection.returns({
        evidenceError: {
          text: "Minimum of one evidence file required",
        },
      });

      adaptor.processForm(requestStub, responseStub);

      assert.equal(
        uploadEvidenceValidator.validateEvidenceSelection.calledWith(undefined),
        true,
      );
      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0).args;
      assert.equal(view, "claim/evidence");
      assert.deepEqual(viewModel, {
        csrfToken: "csrf-token",
        errorSummaries: {
          evidenceError: {
            text: "Minimum of one evidence file required",
          },
        },
        uploadedFiles: [],
      });
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("redirects to /claim/check-your-answers when at least one evidence file is in session", () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        evidenceFiles: [{ id: "file-id-123", fileName: "test-evidence.pdf" }],
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(
        uploadEvidenceValidator.validateEvidenceSelection.callCount,
        1,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
      assert.equal(responseStub.render.callCount, 0);
    });
  });

  describe("processEvidenceUpload", () => {
    const evidenceFileId = "file-id-123";
    const evidenceFileName = "test-evidence.pdf";

    const setupFileRequest = (): StubbedInstance<Request> => {
      const requestStub = stubInterface<Request>();
      requestStub.file = {
        buffer: Buffer.from("evidence-content"),
        mimetype: "application/pdf",
        originalname: evidenceFileName,
        size: 16,
      } as Express.Multer.File;
      requestStub.body = {};
      return requestStub;
    };

    it("redirects for no-js uploads and appends uploaded evidence metadata to claim session", async () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );
      const requestStub = setupFileRequest();
      requestStub.body.uploadMode = "html";
      requestStub.session.claim = {
        evidenceFiles: [
          {
            id: "existing-id",
            fileName: "existing-file.pdf",
          },
        ],
      };

      const responseStub = stubInterface<Response>();
      uploadEvidenceUseCase.execute.resolves({
        status: "SUCCESS",
        data: {
          evidenceFileId,
          evidenceFileName,
        },
      });

      await adaptor.processEvidenceUpload(requestStub, responseStub);

      assert.deepEqual(requestStub.session.claim?.evidenceFiles, [
        {
          id: "existing-id",
          fileName: "existing-file.pdf",
        },
        {
          id: evidenceFileId,
          fileName: evidenceFileName,
          sizeBytes: 16,
        },
      ]);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/evidence");
      assert.equal(responseStub.json.callCount, 0);
    });

    it("returns 201 JSON for js uploads and appends uploaded evidence metadata to claim session", async () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );
      const requestStub = setupFileRequest();
      requestStub.session.claim = {};

      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);

      uploadEvidenceUseCase.execute.resolves({
        status: "SUCCESS",
        data: {
          evidenceFileId,
          evidenceFileName,
        },
      });

      await adaptor.processEvidenceUpload(requestStub, responseStub);

      assert.deepEqual(requestStub.session.claim?.evidenceFiles, [
        {
          id: evidenceFileId,
          fileName: evidenceFileName,
          sizeBytes: 16,
        },
      ]);
      assert.equal(responseStub.status.calledWith(HTTP_CREATED), true);
      assert.equal(responseStub.json.callCount, 1);
      assert.deepEqual(responseStub.json.getCall(0).args[0], {
        success: {
          messageText: `${evidenceFileName} uploaded`,
          messageHtml: `${evidenceFileName} uploaded`,
        },
        file: {
          filename: evidenceFileId,
          originalname: evidenceFileName,
        },
      });
    });

    it("re-renders the evidence page for no-js uploads with validation errors", async () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );
      const requestStub = setupFileRequest();
      requestStub.body.uploadMode = "html";
      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      responseStub.locals = { csrfToken: "csrf-token" };

      uploadEvidenceValidator.validateEvidenceUploadFile.returns({
        evidenceError: { text: CLAIM_EVIDENCE_ERROR.FILE_TOO_LARGE },
      });

      await adaptor.processEvidenceUpload(requestStub, responseStub);

      assert.equal(responseStub.status.calledWith(HTTP_BAD_REQUEST), true);
      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0).args;
      assert.equal(view, "claim/evidence");
      assert.deepEqual(viewModel, {
        csrfToken: "csrf-token",
        errorSummaries: {
          evidenceError: { text: CLAIM_EVIDENCE_ERROR.FILE_TOO_LARGE },
        },
        uploadedFiles: [],
      });
    });

    it("returns json error for js upload validation failures", async () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );
      const requestStub = setupFileRequest();
      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);

      uploadEvidenceValidator.validateEvidenceUploadFile.returns({
        evidenceError: { text: CLAIM_EVIDENCE_ERROR.FILE_IS_EMPTY },
      });

      await adaptor.processEvidenceUpload(requestStub, responseStub);

      assert.equal(
        responseStub.status.calledWith(HTTP_UNPROCESSABLE_CONTENT),
        true,
      );
      assert.equal(responseStub.json.callCount, 1);
      assert.deepEqual(responseStub.json.getCall(0).args[0], {
        error: { message: CLAIM_EVIDENCE_ERROR.FILE_IS_EMPTY },
        file: {
          filename: "",
          originalname: evidenceFileName,
        },
      });
    });

    it("re-renders no-js upload errors when upstream upload fails", async () => {
      const adaptor = new EvidenceAdaptor(
        uploadEvidenceValidator,
        uploadEvidenceUseCase,
      );
      const requestStub = setupFileRequest();
      requestStub.body.uploadMode = "html";
      const responseStub = stubInterface<Response>();
      responseStub.status.returns(responseStub);
      responseStub.locals = { csrfToken: "csrf-token" };

      uploadEvidenceUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "FILE_SCAN_FOUND_VIRUS",
      });

      await adaptor.processEvidenceUpload(requestStub, responseStub);

      assert.equal(
        responseStub.status.calledWith(HTTP_SERVICE_UNAVAILABLE),
        true,
      );
      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0).args;
      assert.equal(view, "claim/evidence");
      assert.deepEqual(viewModel, {
        csrfToken: "csrf-token",
        errorSummaries: {
          evidenceError: { text: CLAIM_EVIDENCE_ERROR.FILE_SCAN_FOUND_VIRUS },
        },
        uploadedFiles: [],
      });
    });
  });
});
