import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { FinancialRecoveryCostsAdaptor } from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.adaptor.js";
import { FinancialRecoveryCostsValidator } from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { FINANCIAL_RECOVERY_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FinancialRecoveryCosts adaptor", () => {
  describe("renderForm", () => {
    it("redirects to inquest outcome recovery when recovery cost made has not been answered", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("renders the recovery costs form with csrf token, saved values and default back link", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        recoveryCostMade: "YES",
        recoveryCosts: "100",
        recoveryDamages: "200",
        recoveryInterest: "300",
        recoveryPreCertificateCosts: "400",
      };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/recovery-costs");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.costs, "100");
      assert.equal(viewModel.damages, "200");
      assert.equal(viewModel.interest, "300");
      assert.equal(viewModel.previousPreCertificateCosts, "400");
      assert.equal(viewModel.backHref, "/claim/inquest-outcome-recovery");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "NO" };
      requestStub.query = { from: "check-your-answers" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });
  });

  describe("processForm", () => {
    it("redirects to inquest outcome recovery when recovery cost made has not been answered", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { costs: "100" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(requestStub.session.claim?.recoveryCosts, undefined);
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("saves the four recovery values to session and redirects to paying party", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "YES" };
      requestStub.body = {
        costs: "100",
        damages: "200",
        interest: "300",
        "previous-pre-certificate-costs": "400",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCosts, "100");
      assert.equal(requestStub.session.claim?.recoveryDamages, "200");
      assert.equal(requestStub.session.claim?.recoveryInterest, "300");
      assert.equal(
        requestStub.session.claim?.recoveryPreCertificateCosts,
        "400",
      );
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/paying-party",
      );
    });

    it("preserves existing claim session data when saving", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "FINAL_BILL",
        recoveryCostMade: "NO",
      };
      requestStub.body = {
        costs: "100",
        "previous-pre-certificate-costs": "400",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.recoveryCosts, "100");
    });

    it("re-renders the form with errors when costs, damages and interest are missing and recovery cost has been made", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "YES" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/recovery-costs");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(viewModel.errorSummaries, {
        costsInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_COSTS,
        },
        damagesInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_DAMAGES,
        },
        interestInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_INTEREST,
        },
      });
      assert.equal(requestStub.session.claim?.recoveryCosts, undefined);
    });

    it("re-renders the form with an error when previous pre-certificate costs is missing and recovery cost has not been made", () => {
      const adaptor = new FinancialRecoveryCostsAdaptor(
        new FinancialRecoveryCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "DONT_KNOW" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);
      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.deepEqual(viewModel.errorSummaries, {
        previousPreCertificateCostsInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_PREVIOUS_PRE_CERTIFICATE_COSTS,
        },
      });
    });
  });
});
