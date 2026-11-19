import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ValidateBeforeYouStartDeclarationUseCase } from "#src/use-cases/common/validateDeclaration/ValidateBeforeYouStartDeclaration.useCase.js";
import { ApplicationDeclarationAdaptor } from "#src/adaptors/presenters/apply/ApplicationDeclaration/ApplicationDeclaration.adaptor.js";
import { BEFORE_YOU_START_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";
import * as journeyStepHelper from "#src/adaptors/presenters/utils/journeyStepHelper.js";
import type { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";

function buildAdaptor(
  sessionHelper: SessionHelper = stubInterface<SessionHelper>(),
) {
  const validateApplicationDeclarationUseCase =
    new ValidateBeforeYouStartDeclarationUseCase();
  return new ApplicationDeclarationAdaptor(
    validateApplicationDeclarationUseCase,
    sessionHelper,
  );
}

describe("ApplicationDeclaration adaptor", () => {
  describe("startNewApplication", () => {
    it("clears the application data and redirects to /apply", () => {
      const sessionHelper = stubInterface<SessionHelper>();
      const adaptor = buildAdaptor(sessionHelper);
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.startNewApplication(requestStub, responseStub);

      assert.equal(sessionHelper.clearFormData.callCount, 1);
      assert.equal(sessionHelper.clearFormData.getCall(0).args[0], requestStub);
      assert.equal(responseStub.redirect.callCount, 1);
      assert.deepEqual(responseStub.redirect.getCall(0).args, ["/apply"]);
    });
  });

  describe("renderForm", () => {
    it("renders the application declaration form", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/application-declaration");
      assert.equal(
        (renderArgs[1] as unknown as Record<string, unknown>).csrfToken,
        "test-token",
      );
    });
  });

  describe("processForm", () => {
    it("re-renders form with error when application declaration is not checked", () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "application-declaration-confirmation": "" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/application-declaration");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          noDeclarationConfirmation: {
            text: BEFORE_YOU_START_DECLARATION_ERROR,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves application declaration confirmation to session and redirects to /apply/office-accounts when valid", () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "application-declaration-confirmation": "true" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.applicationDeclaration, true);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/apply/office-accounts");
      assert.equal(responseStub.render.callCount, 0);
      assert.equal(requestStub.session.lastCompletedStepIndex, 0);
    });
  });
});
