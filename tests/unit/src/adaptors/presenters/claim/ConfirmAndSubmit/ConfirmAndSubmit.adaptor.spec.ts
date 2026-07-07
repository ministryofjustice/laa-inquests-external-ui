import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ConfirmAndSubmitAdaptor } from "#src/adaptors/presenters/claim/ConfirmAndSubmit/ConfirmAndSubmit.adaptor.js";
import { CONFIRM_CLAIM_PLACEHOLDER } from "#src/infrastructure/locales/constants.js";

describe("ConfirmAndSubmit adaptor", () => {
  describe("renderForm", () => {
    it("renders the confirm and submit view", () => {
      const adaptor = new ConfirmAndSubmitAdaptor();

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
      const adaptor = new ConfirmAndSubmitAdaptor();

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
      const adaptor = new ConfirmAndSubmitAdaptor();

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
      const adaptor = new ConfirmAndSubmitAdaptor();

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
    it("redirects to the claim start page when the claim is submitted", () => {
      const adaptor = new ConfirmAndSubmitAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/");
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
