import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ValidateBeforeYouStartDeclarationUseCase } from "#src/use-cases/common/validateDeclaration/ValidateBeforeYouStartDeclaration.useCase.js";
import { ApplicationDeclarationAdaptor } from "#src/adaptors/presenters/apply/ApplicationDeclaration/ApplicationDeclaration.adaptor.js";
import { BEFORE_YOU_START_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";

function buildAdaptor() {
  const validateApplicationDeclarationUseCase =
    new ValidateBeforeYouStartDeclarationUseCase();
  return new ApplicationDeclarationAdaptor(
    validateApplicationDeclarationUseCase,
  );
}

describe("ApplicationDeclaration adaptor", () => {
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

    //TODO: Test clearing the application data?
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
    });
  });
});
