import { assert } from "chai";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { HomeAdaptor } from "#src/adaptors/presenters/home/Home.adaptor.js";
import { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";

describe("Home adaptor", () => {
  describe("renderHome", () => {
    it("clears apply form data and renders the home page", () => {
      const sessionHelper = stubInterface<SessionHelper>();
      const adaptor = new HomeAdaptor(sessionHelper);

      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      adaptor.renderHome(requestStub, responseStub);

      assert.equal(
        sessionHelper.clearApplyFormData.callCount,
        1,
        "clearApplyFormData should be called once",
      );
      assert.equal(
        sessionHelper.clearApplyFormData.getCall(0).args[0],
        requestStub,
        "clearApplyFormData should be called with req",
      );
      assert.equal(responseStub.render.callCount, 1);
      assert.equal(responseStub.render.getCall(0).args[0], "main/index");
    });
  });
});
