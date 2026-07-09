import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";

describe("Evidence adaptor", () => {
  describe("renderForm", () => {
    it("renders the evidence view", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/evidence");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });
  });

  describe("processForm", () => {
    it("redirects to /claim/check-your-answers when the form is submitted", () => {
      const adaptor = new EvidenceAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/check-your-answers");
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
