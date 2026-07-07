import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { ConfirmAndSubmitAdaptor } from "#src/adaptors/presenters/claim/ConfirmAndSubmit/ConfirmAndSubmit.adaptor.js";
import { CONFIRM_CLAIM_PLACEHOLDER } from "#src/infrastructure/locales/constants.js";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import { SubmitClaimUseCase } from "#src/use-cases/claim/SubmitClaim.useCase.js";

describe("ConfirmAndSubmit adaptor", () => {
  let claimSubmitPort: StubbedInstance<ClaimSubmitPort>;
  let submitClaimUseCase: StubbedInstance<SubmitClaimUseCase>;

  beforeEach(() => {
    claimSubmitPort = stubInterface<ClaimSubmitPort>();
    submitClaimUseCase = stubInterface<SubmitClaimUseCase>();
  });
  describe("renderForm", () => {
    it("renders the confirm and submit view", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/check-your-answers");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });

    it("maps the case reference and claim answers from the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: {
          reference: "ABC-12345",
          clientName: "Jane Smith",
          clientFirstName: "Jane",
          clientLastName: "Smith",
          dateOfBirth: "01/01/2000",
        },
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.caseDetails.caseReference, "ABC-12345");
      assert.equal(viewModel.caseDetails.clientFirstName, "Jane");
      assert.equal(viewModel.caseDetails.clientLastName, "Smith");
      assert.equal(viewModel.caseDetails.clientDateOfBirth, "01/01/2000");
      assert.equal(
        viewModel.claimDetails.claimType,
        "Payment on account (POA)",
      );
      assert.equal(viewModel.claimDetails.claimSubtype, "Expert cost");
    });

    it("falls back to empty strings when the claim answers are not in the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(viewModel.caseDetails.caseReference, "");
      assert.equal(viewModel.caseDetails.clientFirstName, "");
      assert.equal(viewModel.caseDetails.clientLastName, "");
      assert.equal(viewModel.caseDetails.clientDateOfBirth, "");
      assert.equal(viewModel.claimDetails.claimType, "");
      assert.equal(viewModel.claimDetails.claimSubtype, "");
    });

    it("provides placeholder cost and evidence details", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, Record<string, unknown>>;

      assert.equal(
        viewModel.cost.netTotal,
        CONFIRM_CLAIM_PLACEHOLDER.NET_TOTAL,
      );
      assert.equal(
        viewModel.cost.grossTotal,
        CONFIRM_CLAIM_PLACEHOLDER.GROSS_TOTAL,
      );
      assert.deepEqual(
        viewModel.evidence.uploadedFiles,
        CONFIRM_CLAIM_PLACEHOLDER.UPLOADED_FILES,
      );
    });
  });

  describe("processForm", () => {
    it("calls the submit claim use case with session data", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 99 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
      };
      requestStub.session.providerEmail = "solicitor@firm.co.uk";
      requestStub.session.accessToken = "my-token";

      await adaptor.processForm(requestStub, responseStub);

      assert(submitClaimUseCase.execute.calledOnce);
      const [input] = submitClaimUseCase.execute.getCall(0).args;
      assert.equal(input.laaReference, "1");
      assert.equal(input.claimType, "PAYMENT_ON_ACCOUNT");
      assert.equal(input.poaTypeId, "PROFIT_COST");
      assert.equal(input.claimantId, "solicitor@firm.co.uk");
      assert.equal(input.accessToken, "my-token");
    });

    it("stores the claimReferenceNumber in the session and redirects to the confirmation page on success", async () => {
      submitClaimUseCase.execute.resolves({
        status: "SUCCESS",
        data: { claimId: 42 },
      });
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
      };
      requestStub.session.providerEmail = "test@provider.co.uk";
      requestStub.session.accessToken = "my-token";

      await adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claimReferenceNumber, "42");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/confirmation/success");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("does not redirect when the use case returns TECHNICAL_FAILURE", async () => {
      submitClaimUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      });
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort, {
        submitClaim: submitClaimUseCase,
      });

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        caseReference: "1",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
      };

      await adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
    });
  });

  describe("renderConfirmSuccess", () => {
    it("renders the claim confirmation success view with the claim reference number from the session", () => {
      const adaptor = new ConfirmAndSubmitAdaptor(claimSubmitPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claimReferenceNumber = "99";

      adaptor.renderConfirmSuccess(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/confirm-success");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.claimReferenceNumber, "99");
    });
  });
});
