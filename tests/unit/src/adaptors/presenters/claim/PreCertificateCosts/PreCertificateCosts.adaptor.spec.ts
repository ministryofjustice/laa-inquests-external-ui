import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { PreCertificateCostsAdaptor } from "#src/adaptors/presenters/claim/PreCertificateCosts/PreCertificateCosts.adaptor.js";
import { PreCertificateCostsValidator } from "#src/adaptors/presenters/claim/PreCertificateCosts/PreCertificateCosts.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { PRE_CERTIFICATE_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("PreCertificateCosts adaptor", () => {
  describe("renderForm", () => {
    it("redirects to inquest outcome recovery when recovery cost made is Yes", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "YES" };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("renders the pre-certificate costs form with csrf token, saved value and default back link", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        recoveryCostMade: "NO",
        preCertificateCosts: "400",
      };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/pre-cert-costs");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.preCertificateCosts, "400");
      assert.equal(viewModel.backHref, "/claim/inquest-outcome-recovery");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "DONT_KNOW" };
      requestStub.query = { from: "check-your-answers" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });

    it("sets the back link to recovery cost made when reached via a recovery cost made edit", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        recoveryCostMade: "NO",
        returnToCheckYourAnswers: true,
        recoveryCostMadeEditInProgress: true,
      };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/inquest-outcome-recovery");
    });
  });

  describe("processForm", () => {
    it("redirects to inquest outcome recovery when recovery cost made is Yes", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "YES" };
      requestStub.body = { "pre-certificate-costs": "400" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(requestStub.session.claim?.preCertificateCosts, undefined);
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("saves the pre-certificate costs to session and redirects to paying party", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "NO" };
      requestStub.body = { "pre-certificate-costs": "400" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.preCertificateCosts, "400");
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/paying-party",
      );
    });

    it("saves and redirects to check your answers, clearing the flags, when returning to check your answers", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        recoveryCostMade: "NO",
        returnToCheckYourAnswers: true,
        recoveryCostMadeEditInProgress: true,
      };
      requestStub.body = { "pre-certificate-costs": "400" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.preCertificateCosts, "400");
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
      assert.equal(
        requestStub.session.claim?.recoveryCostMadeEditInProgress,
        undefined,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/check-your-answers",
      );
    });

    it("preserves existing claim session data when saving", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "FINAL_BILL",
        recoveryCostMade: "DONT_KNOW",
      };
      requestStub.body = { "pre-certificate-costs": "400" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.preCertificateCosts, "400");
    });

    it("saves a blank value and redirects to paying party when the field is missing", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "NO" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/paying-party",
      );
    });

    it("re-renders the form with an error when the field is not a valid amount", () => {
      const adaptor = new PreCertificateCostsAdaptor(
        new PreCertificateCostsValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { recoveryCostMade: "NO" };
      requestStub.body = { "pre-certificate-costs": "abc" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.deepEqual(viewModel.errorSummaries, {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.INVALID,
        },
      });
    });
  });
});
