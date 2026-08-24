import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { FinalBillTemplateAdaptor } from "#src/adaptors/presenters/claim/FinalBillTemplate/FinalBillTemplate.adaptor.js";
import type { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";
import type { DeleteEvidenceUseCase } from "#src/use-cases/claim/DeleteEvidence.useCase.js";
import type { FinalBillTemplateValidator } from "#src/adaptors/presenters/claim/FinalBillTemplate/FinalBillTemplate.validator.js";
import {
  CLAIM_FINAL_BILL_TEMPLATE_ERROR,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";

describe("FinalBillTemplate adaptor", () => {
  let uploadEvidenceUseCase: StubbedInstance<UploadEvidenceUseCase>;
  let deleteEvidenceUseCase: StubbedInstance<DeleteEvidenceUseCase>;
  let formValidator: StubbedInstance<FinalBillTemplateValidator>;

  beforeEach(() => {
    uploadEvidenceUseCase = stubInterface<UploadEvidenceUseCase>();
    deleteEvidenceUseCase = stubInterface<DeleteEvidenceUseCase>();
    formValidator = stubInterface<FinalBillTemplateValidator>();
    formValidator.validateTemplateSelection.returns({});
    formValidator.validateTemplateUploadFile.returns({});
  });

  function buildAdaptor(): FinalBillTemplateAdaptor {
    return new FinalBillTemplateAdaptor(
      formValidator,
      uploadEvidenceUseCase,
      deleteEvidenceUseCase,
    );
  }

  describe("renderForm", () => {
    it("renders the final bill template view with no uploaded file", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];
      assert.equal(view, "claim/final-bill-template");
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.uploadedFile, undefined);
      assert.equal(viewModel.backHref, "/claim/total-cost");
    });

    it("renders the uploaded file from session", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        finalBillCostTemplate: {
          costTemplateId: "template-id-123",
          costTemplateFilename: "cost-template.xlsx",
        },
      };

      adaptor.renderForm(requestStub, responseStub);

      const [, viewModel] = responseStub.render.getCall(0).args as unknown as [
        string,
        Record<string, unknown>,
      ];
      assert.deepEqual(viewModel.uploadedFile, {
        costTemplateId: "template-id-123",
        costTemplateFilename: "cost-template.xlsx",
      });
    });
  });

  describe("processForm", () => {
    it("re-renders with errors when no template has been uploaded", () => {
      formValidator.validateTemplateSelection.returns({
        templateError: { text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_REQUIRED },
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const [view, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];
      assert.equal(view, "claim/final-bill-template");
      assert.deepEqual(viewModel.errorSummaries, {
        templateError: { text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_REQUIRED },
      });
    });

    it("redirects to /claim/evidence when a template has been uploaded", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.getCall(0).args[0], "/claim/evidence");
    });

    it("redirects to /claim/check-your-answers when returning from that page", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/check-your-answers",
      );
    });
  });

  describe("processTemplateUpload", () => {
    it("returns a validation error as JSON when the file is invalid", async () => {
      formValidator.validateTemplateUploadFile.returns({
        templateError: {
          text: CLAIM_FINAL_BILL_TEMPLATE_ERROR.INVALID_FILE_TYPE,
        },
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);

      await adaptor.processTemplateUpload(requestStub, responseStub);

      assert.equal(
        responseStub.status.getCall(0).args[0],
        HTTP_UNPROCESSABLE_CONTENT,
      );
      assert.equal(
        (responseStub.json.getCall(0).args[0] as { error: { message: string } })
          .error.message,
        CLAIM_FINAL_BILL_TEMPLATE_ERROR.INVALID_FILE_TYPE,
      );
    });

    it("stores the uploaded template in session and returns 201 on success", async () => {
      uploadEvidenceUseCase.execute.resolves({
        status: "SUCCESS",
        data: {
          evidenceFileId: "template-id-123",
          evidenceFileName: "cost-template.xlsx",
        },
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);
      requestStub.file = {
        buffer: Buffer.from("test"),
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        originalname: "cost-template.xlsx",
        size: 4,
      } as Express.Multer.File;

      await adaptor.processTemplateUpload(requestStub, responseStub);

      assert.equal(responseStub.status.getCall(0).args[0], HTTP_CREATED);
      assert.deepEqual(requestStub.session.claim?.finalBillCostTemplate, {
        costTemplateId: "template-id-123",
        costTemplateFilename: "cost-template.xlsx",
        costTemplateFileSize: 4,
      });
    });

    it("returns a service unavailable error when the upload fails", async () => {
      uploadEvidenceUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "UPSTREAM_REJECTED",
      });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      responseStub.status.returns(responseStub);
      requestStub.file = {
        buffer: Buffer.from("test"),
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        originalname: "cost-template.xlsx",
        size: 4,
      } as Express.Multer.File;

      await adaptor.processTemplateUpload(requestStub, responseStub);

      assert.equal(
        responseStub.status.getCall(0).args[0],
        HTTP_SERVICE_UNAVAILABLE,
      );
    });
  });

  describe("processTemplateDelete", () => {
    it("returns 400 when no file identifier is provided", async () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.status.returns(responseStub);
      requestStub.body = {};

      await adaptor.processTemplateDelete(requestStub, responseStub);

      assert.equal(responseStub.status.getCall(0).args[0], HTTP_BAD_REQUEST);
    });

    it("clears the session and returns success when the delete succeeds", async () => {
      deleteEvidenceUseCase.execute.resolves({ status: "SUCCESS" });
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.status.returns(responseStub);
      requestStub.body = { delete: "template-id-123" };
      requestStub.session.claim = {
        finalBillCostTemplate: {
          costTemplateId: "template-id-123",
          costTemplateFilename: "cost-template.xlsx",
        },
      };

      await adaptor.processTemplateDelete(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.finalBillCostTemplate, undefined);
      assert.equal(responseStub.json.getCall(0).args[0].success, true);
    });
  });
});
