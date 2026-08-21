import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { CounselNumberAdaptor } from "#src/adaptors/presenters/claim/CounselNumber/CounselNumber.adaptor.js";
import { CounselNumberValidator } from "#src/adaptors/presenters/claim/CounselNumber/CounselNumber.validator.js";
import { COUNSEL_NUMBER_ERROR } from "#src/infrastructure/locales/constants.js";

describe("CounselNumber adaptor", () => {
  describe("renderForm", () => {
    it("renders the counsel number form with the session selection", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { counselNumber: "2" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/counsel-number");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.counselNumber, "2");
      assert.equal(viewModel.backHref, "/claim/evidence");
    });

    it("sets returnToCheckYourAnswers flag and back link when from=check-your-answers is present", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.query = { from: "check-your-answers" };
      requestStub.session.claim = { counselNumber: "2" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });
  });

  describe("processForm", () => {
    it("re-renders the form with an error when no counsel number is selected", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/counsel-number");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          counselNumberInputError: {
            text: COUNSEL_NUMBER_ERROR.MISSING_COUNSEL_NUMBER,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves the counsel number and skips to /claim/check-your-answers when 0 is selected", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-number": "0" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.counselNumber, "0");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("saves the counsel number and redirects to /claim/counsel-pay-confirmation when more than 0 is selected", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-number": "3" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.counselNumber, "3");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/counsel-pay-confirmation");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("routes to /claim/counsel-pay-confirmation and preserves the flag when changing from zero to a non-zero value that has no paid confirmation yet", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-number": "3" };
      requestStub.session.claim = {
        counselNumber: "0",
        returnToCheckYourAnswers: true,
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.counselNumber, "3");
      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/counsel-pay-confirmation");
    });

    it("redirects back to /claim/check-your-answers and clears the flag when a non-zero value already has a paid confirmation", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-number": "3" };
      requestStub.session.claim = {
        counselNumber: "2",
        counselBillsPaid: true,
        returnToCheckYourAnswers: true,
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.counselNumber, "3");
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
    });

    it("clears any paid confirmation and returns to check your answers when changing to zero counsel", () => {
      const adaptor = new CounselNumberAdaptor(new CounselNumberValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-number": "0" };
      requestStub.session.claim = {
        counselNumber: "2",
        counselBillsPaid: true,
        returnToCheckYourAnswers: true,
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.counselNumber, "0");
      assert.equal(requestStub.session.claim?.counselBillsPaid, undefined);
      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
    });
  });
});
