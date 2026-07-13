import { strict as assert } from "assert";
import type { Request, Response } from "express";
import { stubInterface } from "ts-sinon";
import { TotalClaimAdaptor } from "#src/adaptors/presenters/claim/TotalClaim/TotalClaim.adaptor.js";
import { TOTAL_CLAIM_ERROR } from "#src/infrastructure/locales/constants.js";

describe("TotalClaim adaptor", () => {
  describe("renderForm", () => {
    it("renders the total claim view with csrf token and back link", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: {
          type: "PAYMENT_ON_ACCOUNT",
          zeroVatTotal: "10.00",
          netTotal: "100.00",
          grossTotal: "130.00",
        },
      } as Request["session"];

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const [viewName, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, string>];

      assert.equal(viewName, "claim/total-cost");
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.backHref, "/claim/subtype");
      assert.equal(viewModel.zeroVatTotal, "10.00");
      assert.equal(viewModel.netTotal, "100.00");
      assert.equal(viewModel.grossTotal, "130.00");
    });
  });

  describe("processForm", () => {
    it("re-renders with validation errors and does not redirect when submission is invalid", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "PAYMENT_ON_ACCOUNT" },
      } as Request["session"];
      requestStub.body = {
        "zero-vat-total": "",
        "net-total": "100",
        "gross-total": "",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);

      const [viewName, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];

      assert.equal(viewName, "claim/total-cost");
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.backHref, "/claim/subtype");
      assert.deepEqual(viewModel.errorSummaries, {
        grossTotalInputError: {
          text: TOTAL_CLAIM_ERROR.MISSING_GROSS_TOTAL_WHEN_NET_ENTERED,
        },
      });
    });

    it("saves values to session and redirects when submission is valid", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "PAYMENT_ON_ACCOUNT" },
      } as Request["session"];
      requestStub.body = {
        "zero-vat-total": "100.00",
        "net-total": "250.25",
        "gross-total": "400.30",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectPath] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectPath, "/claim/evidence");

      assert.equal(requestStub.session.claim?.zeroVatTotal, "100.00");
      assert.equal(requestStub.session.claim?.netTotal, "250.25");
      assert.equal(requestStub.session.claim?.grossTotal, "400.30");
    });
  });
});
