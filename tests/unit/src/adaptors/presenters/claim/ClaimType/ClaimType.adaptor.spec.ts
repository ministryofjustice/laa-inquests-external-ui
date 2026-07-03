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
      requestStub.session.claimType = "NIL_BILL";

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-type");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.claimType, "NIL_BILL");
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

    it("saves the claim type to session and redirects to /claim/subtype when valid", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claimType, "FINAL_BILL");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/subtype");
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
