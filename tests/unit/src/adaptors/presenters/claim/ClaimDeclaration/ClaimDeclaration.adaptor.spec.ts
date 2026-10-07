import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ValidateBeforeYouStartDeclarationUseCase } from "#src/use-cases/common/validateDeclaration/ValidateBeforeYouStartDeclaration.useCase.js";
import { ClaimDeclarationAdaptor } from "#src/adaptors/source/inquests-api/claim/ClaimDeclaration/ClaimDeclaration.adaptor.js";
import { BEFORE_YOU_START_DECLARATION_ERROR } from "#src/infrastructure/locales/constants.js";

function buildAdaptor() {
  const validateClaimDeclarationUseCase =
    new ValidateBeforeYouStartDeclarationUseCase();
  return new ClaimDeclarationAdaptor(validateClaimDeclarationUseCase);
}

describe("ClaimDeclaration adaptor", () => {
  describe("renderForm", () => {
    it("renders the claim declaration form", () => {
      const adaptor = buildAdaptor();
      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/before-you-make-a-claim");
      assert.equal(
        (renderArgs[1] as unknown as Record<string, unknown>).csrfToken,
        "test-token",
      );
    });

    it("clears the claim session data", () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-123",
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim, undefined);
    });
  });

  describe("processForm", () => {
    it("re-renders form with error when claim declaration is not checked", () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-declaration-confirmation": "" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/before-you-make-a-claim");
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

    it("saves claim declaration confirmation to session and redirects to /claim/search when valid", () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-declaration-confirmation": "true" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claimDeclaration, true);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/search");
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
