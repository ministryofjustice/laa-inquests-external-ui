import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { RecoveryCostMadeAdaptor } from "#src/adaptors/presenters/claim/RecoveryCostMade/RecoveryCostMade.adaptor.js";
import { RecoveryCostMadeValidator } from "#src/adaptors/presenters/claim/RecoveryCostMade/RecoveryCostMade.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { RECOVERY_COST_ERROR } from "#src/infrastructure/locales/constants.js";

describe("RecoveryCostMade adaptor", () => {
  describe("renderForm", () => {
    it("renders the recovery cost made form with csrf token and default back link", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/inquest-outcome-recovery");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.backHref, "/claim/funding-post-inquest");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.query = { from: "check-your-answers" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });
  });

  describe("processForm", () => {
    it("saves Yes and redirects to recovery costs", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "recovery-cost-made": "YES" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCostMade, "YES");
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/recovery-costs",
      );
    });

    it("saves No and redirects to pre-certificate costs", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "recovery-cost-made": "NO" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCostMade, "NO");
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/pre-cert-costs",
      );
    });

    it("saves Don't know and redirects to pre-certificate costs", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "recovery-cost-made": "DONT_KNOW" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCostMade, "DONT_KNOW");
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/pre-cert-costs",
      );
    });

    it("clears the pre-certificate costs value when Yes is selected", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { preCertificateCosts: "400" };
      requestStub.body = { "recovery-cost-made": "YES" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCostMade, "YES");
      assert.equal(requestStub.session.claim?.preCertificateCosts, undefined);
    });

    it("clears the financial recovery cost values when No is selected", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        recoveryCosts: "100",
        recoveryDamages: "200",
        recoveryInterest: "300",
        recoveryPreCertificateCosts: "400",
      };
      requestStub.body = { "recovery-cost-made": "NO" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCostMade, "NO");
      assert.equal(requestStub.session.claim?.recoveryCosts, undefined);
      assert.equal(requestStub.session.claim?.recoveryDamages, undefined);
      assert.equal(requestStub.session.claim?.recoveryInterest, undefined);
      assert.equal(
        requestStub.session.claim?.recoveryPreCertificateCosts,
        undefined,
      );
    });

    it("keeps the financial recovery cost values when Yes is re-selected", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        recoveryCostMade: "YES",
        recoveryCosts: "100",
      };
      requestStub.body = { "recovery-cost-made": "YES" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.recoveryCosts, "100");
    });

    it("re-renders the form with an error when no option is selected", () => {
      const adaptor = new RecoveryCostMadeAdaptor(
        new RecoveryCostMadeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/inquest-outcome-recovery");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(
        (viewModel.errorSummaries as Record<string, unknown>)
          .recoveryCostMadeInputError,
        { text: RECOVERY_COST_ERROR.MISSING_SELECTION },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });
  });
});
