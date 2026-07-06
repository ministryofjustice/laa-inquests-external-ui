import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { TotalCostAdaptor } from "#src/adaptors/presenters/claim/TotalCost/TotalCost.adaptor.js";

describe("TotalCost adaptor", () => {
  describe("renderForm", () => {
    it("renders the total cost view", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/total-cost");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
    });
  });

  describe("processForm", () => {
    it("redirects to /claim/evidence when the form is submitted", () => {
      const adaptor = new TotalCostAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/evidence");
      assert.equal(responseStub.render.callCount, 0);
    });
  });
});
