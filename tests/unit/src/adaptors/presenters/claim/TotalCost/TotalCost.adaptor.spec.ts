import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { TotalCostAdaptor } from "#src/adaptors/presenters/claim/TotalCost/TotalCost.adaptor.js";

describe("TotalCost adaptor", () => {
  describe("renderForm", () => {
    it("renders the total cost view", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/total-cost");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });

    it("resets completed journey flags when entering the total cost page", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "PROFIT_COST",
        totalCostCompleted: true,
        evidenceCompleted: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.totalCostCompleted, false);
      assert.equal(requestStub.session.claim?.evidenceCompleted, false);
    });

    it("passes backHref of /claim/subtype when POA was selected", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "PAYMENT_ON_ACCOUNT" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/subtype");
    });

    it("passes backHref of /claim/type when a non-POA type was selected", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "FINAL_BILL" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/type");
    });

    it("passes backHref of /claim/type when no claim type is in the session", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/type");
    });
  });

  describe("processForm", () => {
    it("redirects to /claim/evidence when the form is submitted", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/evidence");
      assert.equal(requestStub.session.claim?.totalCostCompleted, true);
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
