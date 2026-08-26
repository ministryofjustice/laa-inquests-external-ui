import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { CounselPayConfirmationAdaptor } from "#src/adaptors/presenters/claim/CounselPayConfirmation/CounselPayConfirmation.adaptor.js";
import { CounselPayConfirmationValidator } from "#src/adaptors/presenters/claim/CounselPayConfirmation/CounselPayConfirmation.validator.js";
import { COUNSEL_PAY_CONFIRMATION_ERROR } from "#src/infrastructure/locales/constants.js";

describe("CounselPayConfirmation adaptor", () => {
  describe("renderForm", () => {
    it("renders the counsel pay confirmation form", () => {
      const adaptor = new CounselPayConfirmationAdaptor(
        new CounselPayConfirmationValidator(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { counselBillsPaid: true };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/counsel-pay-confirmation");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.counselBillsPaid, true);
      assert.equal(viewModel.backHref, "/claim/counsel-number");
    });

    it("sets returnToCheckYourAnswers flag and back link when from=check-your-answers is present", () => {
      const adaptor = new CounselPayConfirmationAdaptor(
        new CounselPayConfirmationValidator(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.query = { from: "check-your-answers" };
      requestStub.session.claim = { counselBillsPaid: true };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.returnToCheckYourAnswers, true);
      const viewModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.backHref, "/claim/check-your-answers");
    });
  });

  describe("processForm", () => {
    it("re-renders the form with an error when the checkbox is not ticked", () => {
      const adaptor = new CounselPayConfirmationAdaptor(
        new CounselPayConfirmationValidator(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/counsel-pay-confirmation");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          counselPayConfirmationInputError: {
            text: COUNSEL_PAY_CONFIRMATION_ERROR.MISSING_CONFIRMATION,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves the confirmation and redirects to /claim/end-date when the checkbox is ticked", () => {
      const adaptor = new CounselPayConfirmationAdaptor(
        new CounselPayConfirmationValidator(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-bills-paid": "true" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.counselBillsPaid, true);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/end-date");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("clears the returnToCheckYourAnswers flag when returning from check your answers", () => {
      const adaptor = new CounselPayConfirmationAdaptor(
        new CounselPayConfirmationValidator(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "counsel-bills-paid": "true" };
      requestStub.session.claim = { returnToCheckYourAnswers: true };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(
        requestStub.session.claim?.returnToCheckYourAnswers,
        undefined,
      );
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
    });
  });
});
