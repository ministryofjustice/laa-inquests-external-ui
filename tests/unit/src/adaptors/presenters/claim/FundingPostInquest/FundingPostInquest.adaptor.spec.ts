import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { FundingPostInquestAdaptor } from "#src/adaptors/presenters/claim/FundingPostInquest/FundingPostInquest.adaptor.js";
import { FundingPostInquestValidator } from "#src/adaptors/presenters/claim/FundingPostInquest/FundingPostInquest.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { FUNDING_POST_INQUEST_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FundingPostInquest adaptor", () => {
  describe("renderForm", () => {
    it("renders the funding post-inquest form with csrf token and default back link", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
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
      assert.equal(renderArgs[0], "claim/funding-post-inquest");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.backHref, "/claim/inquest-outcome");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
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

    it("passes the previously selected value to the view", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { fundingPostInquest: "YES" };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.fundingPostInquest, "YES");
    });
  });

  describe("processForm", () => {
    it("saves No and redirects to check your answers", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "funding-post-inquest": "NO" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.fundingPostInquest, "NO");
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/check-your-answers",
      );
    });

    it("saves Yes and redirects to the recovery sub-flow", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "funding-post-inquest": "YES" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.fundingPostInquest, "YES");
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("saves Don't know and redirects to the recovery sub-flow", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "funding-post-inquest": "DONT_KNOW" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.fundingPostInquest, "DONT_KNOW");
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("re-renders the form with an error when no option is selected", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
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
      assert.equal(renderArgs[0], "claim/funding-post-inquest");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(
        (viewModel.errorSummaries as Record<string, unknown>)
          .fundingPostInquestInputError,
        { text: FUNDING_POST_INQUEST_ERROR.MISSING_SELECTION },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("returns to check your answers when No is selected and the return flag is set", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };
      requestStub.body = { "funding-post-inquest": "NO" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/check-your-answers",
      );
    });

    it("continues down the sub-flow when Yes is selected even if the return flag is set", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };
      requestStub.body = { "funding-post-inquest": "YES" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/inquest-outcome-recovery",
      );
    });

    it("preserves existing claim session data when saving", () => {
      const adaptor = new FundingPostInquestAdaptor(
        new FundingPostInquestValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "FINAL_BILL" };
      requestStub.body = { "funding-post-inquest": "NO" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.fundingPostInquest, "NO");
    });
  });
});
