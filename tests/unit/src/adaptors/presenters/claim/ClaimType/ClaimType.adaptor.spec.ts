import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ClaimTypeAdaptor } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.adaptor.js";
import { ClaimTypeValidator } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.validator.js";
import { CLAIM_TYPE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("ClaimType adaptor", () => {
  describe("renderForm", () => {
    it("renders the claim type form with the session selection", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "NIL_BILL" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-type");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.claimType, "NIL_BILL");
    });

    it("sets returnToCheckYourAnswers flag when from=check-your-answers query param is present", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.query = { from: "check-your-answers" };
      requestStub.session.claim = { type: "NIL_BILL" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
    });

    it("sets the back link to check-your-answers when returnToCheckYourAnswers is set", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });

    it("sets the back link to the results page when not returning to check-your-answers", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "NIL_BILL" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/results");
    });
  });

  describe("processForm", () => {
    it("re-renders the form with an error when no claim type is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-type");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          claimTypeInputError: {
            text: CLAIM_TYPE_ERROR.MISSING_CLAIM_TYPE,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves the claim type to session and redirects to /claim/subtype when Payment on account is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "PAYMENT_ON_ACCOUNT" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "PAYMENT_ON_ACCOUNT");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/subtype");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("saves the claim type to session and skips to /claim/total-cost when a non-POA type is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/total-cost");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("clears the subtype from the session when a non-POA type is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, undefined);
    });

    it("does not clear the subtype from the session when POA is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "PAYMENT_ON_ACCOUNT" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, "EXPERT_COST");
    });

    it("redirects to /claim/check-your-answers and clears the flag when a non-POA type is selected and flag is set", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.processForm(requestStub, responseStub);

      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
    });

    it("redirects to /claim/subtype and preserves the flag when POA is selected and flag is set", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "PAYMENT_ON_ACCOUNT" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.processForm(requestStub, responseStub);

      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/subtype");
      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
    });
  });

  describe("renderSubtypeForm", () => {
    it("renders the claim subtype form with the session selection", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { subtype: "EXPERT_COST" };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-subtype");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.claimSubtype, "EXPERT_COST");
    });

    it("sets returnToCheckYourAnswers flag when from=check-your-answers query param is present", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.query = { from: "check-your-answers" };
      requestStub.session.claim = { subtype: "EXPERT_COST" };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
    });

    it("sets the back link to check-your-answers when returnToCheckYourAnswers is set", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });

    it("sets the back link to the claim type page when not returning to check-your-answers", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { subtype: "EXPERT_COST" };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/type");
    });
  });

  describe("processSubtypeForm", () => {
    it("re-renders the form with an error when no claim subtype is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = {};

      adaptor.processSubtypeForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-subtype");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          claimSubtypeInputError: {
            text: CLAIM_TYPE_ERROR.MISSING_CLAIM_SUBTYPE,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves the claim subtype to session and redirects to /claim/total-cost when valid", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-subtype": "PROFIT_COST" };

      adaptor.processSubtypeForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, "PROFIT_COST");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/total-cost");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/check-your-answers and clears the flag when flag is set and submission is valid", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-subtype": "PROFIT_COST" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.processSubtypeForm(requestStub, responseStub);

      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
    });
  });
});
