import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { InquestOutcomeAdaptor } from "#src/adaptors/presenters/claim/InquestOutcome/InquestOutcome.adaptor.js";
import { InquestOutcomeValidator } from "#src/adaptors/presenters/claim/InquestOutcome/InquestOutcome.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { INQUEST_OUTCOME_ERROR } from "#src/infrastructure/locales/constants.js";

describe("InquestOutcome adaptor", () => {
  describe("renderForm", () => {
    it("renders the inquest outcome form with csrf token", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
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
      assert.equal(renderArgs[0], "claim/inquest-outcome");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });

    it("renders the form with the back link set to end-date by default", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/end-date");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
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

    it("marks previously selected options as checked", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        inquestOutcomes: ["ACCIDENT_OR_MISADVENTURE"],
      };
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      const options = viewModel.outcomeOptions as Array<{
        value: string;
        checked: boolean;
      }>;
      const accidentOption = options.find(
        (o) => o.value === "ACCIDENT_OR_MISADVENTURE",
      );
      assert.equal(accidentOption?.checked, true);
    });
  });

  describe("processForm", () => {
    it("saves the selected outcome to session and redirects to /claim/funding-post-inquest in normal flow", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = { "inquest-outcome": "ACCIDENT_OR_MISADVENTURE" };

      adaptor.processForm(requestStub, responseStub);

      assert.deepEqual(requestStub.session.claim?.inquestOutcomes, [
        "ACCIDENT_OR_MISADVENTURE",
      ]);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/funding-post-inquest");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/check-your-answers when returnToCheckYourAnswers flag is set", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };
      requestStub.body = { "inquest-outcome": "ACCIDENT_OR_MISADVENTURE" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
    });

    it("saves multiple selected outcomes to session as an array", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {
        "inquest-outcome": ["ACCIDENT_OR_MISADVENTURE"],
      };

      adaptor.processForm(requestStub, responseStub);

      assert.deepEqual(requestStub.session.claim?.inquestOutcomes, [
        "ACCIDENT_OR_MISADVENTURE",
      ]);
    });

    it("re-renders the form with an error when no option is selected", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
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
      assert.equal(renderArgs[0], "claim/inquest-outcome");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(
        (viewModel.errorSummaries as Record<string, unknown>)
          .inquestOutcomeInputError,
        { text: INQUEST_OUTCOME_ERROR.MISSING_SELECTION },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("preserves existing claim session data when saving outcomes", () => {
      const adaptor = new InquestOutcomeAdaptor(
        new InquestOutcomeValidator(),
        new ClaimNavigationHelper(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        type: "FINAL_BILL",
        endDateDay: "21",
        endDateMonth: "3",
        endDateYear: "2026",
      };
      requestStub.body = { "inquest-outcome": "ACCIDENT_OR_MISADVENTURE" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.endDateDay, "21");
      assert.deepEqual(requestStub.session.claim?.inquestOutcomes, [
        "ACCIDENT_OR_MISADVENTURE",
      ]);
    });
  });
});
