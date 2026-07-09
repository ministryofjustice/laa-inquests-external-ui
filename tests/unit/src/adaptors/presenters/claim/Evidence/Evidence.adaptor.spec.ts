import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";

describe("Evidence adaptor", () => {
  const selectedClient = {
    reference: "ABC-12345",
    clientName: "Jane Smith",
    clientFirstName: "Jane",
    clientLastName: "Smith",
    dateOfBirth: "01/01/2000",
  };

  describe("renderForm", () => {
    it("redirects to /claim when no case has been selected", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/type when type is incomplete", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "",
        typeCompleted: false,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/type");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/subtype when POA subtype is incomplete", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "PAYMENT_ON_ACCOUNT",
        typeCompleted: true,
        subtype: "PROFIT_COST",
        subtypeCompleted: false,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/subtype");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/total-cost when total cost has not been completed", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "FINAL_BILL",
        typeCompleted: true,
        totalCostCompleted: false,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/total-cost");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("renders the evidence view", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "FINAL_BILL",
        typeCompleted: true,
        totalCostCompleted: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/evidence");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });

    it("resets evidence completion when entering the evidence page", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "PAYMENT_ON_ACCOUNT",
        typeCompleted: true,
        subtype: "PROFIT_COST",
        subtypeCompleted: true,
        totalCostCompleted: true,
        evidenceCompleted: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.evidenceCompleted, false);
    });
  });

  describe("processForm", () => {
    it("redirects to /claim/check-your-answers when the form is submitted", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
      assert.equal(requestStub.session.claim?.evidenceCompleted, true);
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
