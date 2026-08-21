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

    it("sets returnToCheckYourAnswers flag when from=check-your-answers query param is present", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.query = { from: "check-your-answers" };
      requestStub.session = {
        claim: { type: "PAYMENT_ON_ACCOUNT" },
      } as Request["session"];

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
    });

    it("sets the back link to check-your-answers when returnToCheckYourAnswers is set", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "PAYMENT_ON_ACCOUNT", returnToCheckYourAnswers: true },
      } as Request["session"];

      adaptor.renderForm(requestStub, responseStub);

      const [, viewModel] = responseStub.render.getCall(0).args as unknown as [
        string,
        Record<string, string>,
      ];
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
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

    it("re-renders with combination error when profit cost subtype has both 0% and 20% VAT fields", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "PAYMENT_ON_ACCOUNT", subtype: "PROFIT_COST" },
      } as Request["session"];
      requestStub.body = {
        "zero-vat-total": "150",
        "net-total": "200",
        "gross-total": "440",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);

      const [viewName, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];

      assert.equal(viewName, "claim/total-cost");
      assert.deepEqual(viewModel.errorSummaries, {
        zeroVatTotalInputError: {
          text: TOTAL_CLAIM_ERROR.PROFIT_COST_MIXED_VAT,
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

    it("redirects to check-your-answers and clears the flag when returnToCheckYourAnswers is set and submission is valid", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "PAYMENT_ON_ACCOUNT", returnToCheckYourAnswers: true },
      } as Request["session"];
      requestStub.body = {
        "zero-vat-total": "100.00",
        "net-total": "250.25",
        "gross-total": "400.30",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectPath] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectPath, "/claim/check-your-answers");
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
    });
  });

  describe("FINAL_BILL", () => {
    it("renders the total cost view with isFinalBill and back link to /claim/type", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "FINAL_BILL", grossTotal: "500.00" },
      } as Request["session"];

      adaptor.renderForm(requestStub, responseStub);

      const [viewName, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];

      assert.equal(viewName, "claim/total-cost");
      assert.equal(viewModel.isFinalBill, true);
      assert.equal(viewModel.backHref, "/claim/type");
      assert.equal(viewModel.grossTotal, "500.00");
    });

    it("saves NIL_BILL subtype and redirects to /claim/inquest-outcome when the gross amount is 0", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "FINAL_BILL" },
      } as Request["session"];
      requestStub.body = { "gross-total": "0" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectPath] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectPath, "/claim/inquest-outcome");
      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.subtype, "NIL_BILL");
      assert.equal(requestStub.session.claim?.grossTotal, "0");
    });

    it("treats 0.00 as a nil bill and redirects to /claim/inquest-outcome", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "FINAL_BILL" },
      } as Request["session"];
      requestStub.body = { "gross-total": "0.00" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectPath] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectPath, "/claim/inquest-outcome");
      assert.equal(requestStub.session.claim?.subtype, "NIL_BILL");
    });

    it("clears the subtype and redirects to /claim/final-bill-template when the gross amount is greater than 0", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "FINAL_BILL", subtype: "NIL_BILL" },
      } as Request["session"];
      requestStub.body = { "gross-total": "1250.50" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectPath] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectPath, "/claim/final-bill-template");
      assert.equal(requestStub.session.claim?.grossTotal, "1250.50");
      assert.equal(requestStub.session.claim?.subtype, undefined);
    });

    it("re-renders with an error and does not redirect when the gross amount is invalid", () => {
      const adaptor = new TotalClaimAdaptor();
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session = {
        claim: { type: "FINAL_BILL" },
      } as Request["session"];
      requestStub.body = { "gross-total": "abc" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);

      const [viewName, viewModel] = responseStub.render.getCall(0)
        .args as unknown as [string, Record<string, unknown>];

      assert.equal(viewName, "claim/total-cost");
      assert.equal(viewModel.isFinalBill, true);
      assert.deepEqual(viewModel.errorSummaries, {
        grossTotalInputError: {
          text: TOTAL_CLAIM_ERROR.INVALID_FINAL_BILL_GROSS_TOTAL,
        },
      });
    });
  });
});
