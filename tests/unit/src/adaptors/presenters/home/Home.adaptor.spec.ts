import { assert } from "chai";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { HomeAdaptor } from "#src/adaptors/presenters/home/Home.adaptor.js";
import { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";

describe("Home adaptor", () => {
  describe("renderHome", () => {
    it("clears form data and renders the home page", () => {
      const sessionHelper = stubInterface<SessionHelper>();
      const adaptor = new HomeAdaptor(sessionHelper);

      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();

      adaptor.renderHome(requestStub, responseStub);

      assert.equal(
        sessionHelper.clearFormData.callCount,
        1,
        "clearFormData should be called once",
      );
      assert.equal(
        sessionHelper.clearFormData.getCall(0).args[0],
        requestStub,
        "clearFormData should be called with req",
      );
      assert.equal(responseStub.render.callCount, 1);
      assert.equal(responseStub.render.getCall(0).args[0], "main/index");
    });
  });

  describe("processForm", () => {
    it("redirects to /apply if Apply selected", () => {
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();
      const sessionHelper = stubInterface<SessionHelper>();
      const adaptor = new HomeAdaptor(sessionHelper);

      requestStub.body = { "what-do-you-want-to-do-option": "Apply" };
      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(redirectArgs[0] as unknown as string, "/apply");
    });

    it("redirects to /claim if Claim selected", () => {
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();
      const sessionHelper = stubInterface<SessionHelper>();
      const adaptor = new HomeAdaptor(sessionHelper);

      requestStub.body = { "what-do-you-want-to-do-option": "Claim" };
      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(redirectArgs[0] as unknown as string, "/claim");
    });

    it("renders error message if nothing selected", () => {
      const requestStub = stubInterface<Request>();
      const responseStub = stubInterface<Response>();
      const sessionHelper = stubInterface<SessionHelper>();
      const adaptor = new HomeAdaptor(sessionHelper);

      requestStub.body = { "what-do-you-want-to-do-option": undefined };
      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "main/index");
      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noJourneySelected: {
            text: "Select what you need to do",
          },
        },
      });
    });
  });
});
