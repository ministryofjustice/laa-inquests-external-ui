import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { CannotClaimAdaptor } from "#src/adaptors/presenters/claim/CannotClaim/CannotClaim.adaptor.js";

describe("CannotClaim adaptor", () => {
  describe("renderPage", () => {
    it("renders the cannot-claim page with the case reference and entry variant", () => {
      const adaptor = new CannotClaimAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "INQ-1",
        claimBlocked: true,
      };

      adaptor.renderPage(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/cannot-claim");
      const data = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(data.caseReference, "INQ-1");
      assert.equal(data.variant, "entry");
      assert.equal(data.csrfToken, "test-token");
    });

    it("redirects to /claim when the block flag is not set", () => {
      const adaptor = new CannotClaimAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = { caseReference: "INQ-1" };

      adaptor.renderPage(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim");
    });
  });
});
