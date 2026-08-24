import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { EndDateAdaptor } from "#src/adaptors/presenters/claim/EndDate/EndDate.adaptor.js";
import { EndDateValidator } from "#src/adaptors/presenters/claim/EndDate/EndDate.validator.js";
import { END_DATE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("EndDate adaptor", () => {
  describe("renderForm", () => {
    it("renders the end date form with csrf token", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/end-date");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });

    it("renders the form with the back link set to counsel-pay-confirmation", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.query = {};

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/counsel-pay-confirmation");
    });

    it("renders the form with the back link set to check-your-answers when from=check-your-answers", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.query = { from: "check-your-answers" };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
    });

    it("renders the form with existing session values pre-populated", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        endDateDay: "21",
        endDateMonth: "3",
        endDateYear: "2026",
      };

      adaptor.renderForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      const endDate = viewModel.endDate as Record<string, unknown>;
      assert.equal(endDate.day, "21");
      assert.equal(endDate.month, "3");
      assert.equal(endDate.year, "2026");
    });
  });

  describe("processForm", () => {
    it("saves the end date to session and redirects to /claim/inquest-outcome when date is in the past and not from check-your-answers", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {
        "end-date-day": "21",
        "end-date-month": "3",
        "end-date-year": "2026",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.endDateDay, "21");
      assert.equal(requestStub.session.claim?.endDateMonth, "3");
      assert.equal(requestStub.session.claim?.endDateYear, "2026");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/inquest-outcome");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/check-your-answers when returnToCheckYourAnswers flag is set", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };
      requestStub.body = {
        "end-date-day": "21",
        "end-date-month": "3",
        "end-date-year": "2026",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
    });

    it("preserves existing claim session data when saving the end date", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { type: "FINAL_BILL", subtype: "POA" };
      requestStub.body = {
        "end-date-day": "1",
        "end-date-month": "6",
        "end-date-year": "2025",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.subtype, "POA");
      assert.equal(requestStub.session.claim?.endDateDay, "1");
      assert.equal(requestStub.session.claim?.endDateMonth, "6");
      assert.equal(requestStub.session.claim?.endDateYear, "2025");
    });

    it("re-renders the form with an error when the date is empty", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {
        "end-date-day": "",
        "end-date-month": "",
        "end-date-year": "",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/end-date");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(
        (viewModel.errorSummaries as Record<string, unknown>).endDateInputError,
        { text: END_DATE_ERROR.MISSING_END_DATE },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("re-renders the form with an error when the date is today", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      const today = new Date();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {
        "end-date-day": String(today.getDate()),
        "end-date-month": String(today.getMonth() + 1),
        "end-date-year": String(today.getFullYear()),
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.deepEqual(
        (viewModel.errorSummaries as Record<string, unknown>).endDateInputError,
        { text: END_DATE_ERROR.FUTURE_OR_TODAY_END_DATE },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("re-renders the form with an error when the date is in the future", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {
        "end-date-day": "1",
        "end-date-month": "1",
        "end-date-year": "2099",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.deepEqual(
        (viewModel.errorSummaries as Record<string, unknown>).endDateInputError,
        { text: END_DATE_ERROR.FUTURE_OR_TODAY_END_DATE },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("re-renders the form with submitted values when validation fails", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {};
      requestStub.body = {
        "end-date-day": "32",
        "end-date-month": "13",
        "end-date-year": "2025",
      };

      adaptor.processForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      const endDate = viewModel.endDate as Record<string, unknown>;
      assert.equal(endDate.day, "32");
      assert.equal(endDate.month, "13");
      assert.equal(endDate.year, "2025");
    });

    it("includes the correct back link when re-rendering with validation errors from check-your-answers", () => {
      const adaptor = new EndDateAdaptor(new EndDateValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };
      requestStub.body = {
        "end-date-day": "32",
        "end-date-month": "13",
        "end-date-year": "2025",
      };

      adaptor.processForm(requestStub, responseStub);

      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });
  });
});

