import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { PayingPartyAdaptor } from "#src/adaptors/presenters/claim/PayingParty/PayingParty.adaptor.js";
import { PayingPartyValidator } from "#src/adaptors/presenters/claim/PayingParty/PayingParty.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { PAYING_PARTY_ERROR } from "#src/infrastructure/locales/constants.js";

describe("PayingParty adaptor", () => {
  describe("renderForm", () => {
    it("renders the paying party form with csrf token, saved value and default back link", () => {
      const adaptor = new PayingPartyAdaptor(
        new PayingPartyValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { payingParty: "Acme Ltd" };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/paying-party");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.payingParty, "Acme Ltd");
      assert.equal(viewModel.backHref, "/claim/recovery-costs");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new PayingPartyAdaptor(
        new PayingPartyValidator(),
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
    it("renders the form with a validation error when paying party is empty", () => {
      const adaptor = new PayingPartyAdaptor(
        new PayingPartyValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "paying-party": "" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(requestStub.session.claim?.payingParty, undefined);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/paying-party");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(viewModel.errorSummaries, {
        payingPartyInputError: {
          text: PAYING_PARTY_ERROR.MISSING_PAYING_PARTY,
        },
      });
    });

    it("saves the paying party to session, clears the return flag and redirects to check your answers", () => {
      const adaptor = new PayingPartyAdaptor(
        new PayingPartyValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };
      requestStub.body = { "paying-party": "Acme Ltd" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.payingParty, "Acme Ltd");
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/claim/check-your-answers",
      );
    });

    it("preserves existing claim session data when saving", () => {
      const adaptor = new PayingPartyAdaptor(
        new PayingPartyValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "FINAL_BILL" };
      requestStub.body = { "paying-party": "Acme Ltd" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.payingParty, "Acme Ltd");
    });
  });
});
