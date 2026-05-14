import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { SubmitAdaptor } from "#src/adaptors/presenters/apply/Submit/Submit.adaptor.js";

describe("Submit adaptor", () => {
  const submitAdaptor = new SubmitAdaptor();

  let responseStub = stubInterface<Response>();
  let requestStub = stubInterface<Request>();

  beforeEach(() => {
    responseStub = stubInterface<Response>();
    requestStub = stubInterface<Request>();
    responseStub.locals = {
      csrfToken: "abcdefg",
    };
  });

  describe("renderClientDeclarationForm", () => {
    it("initiates render of view", () => {
      submitAdaptor.renderClientDeclarationForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/submit/client-declaration");
    });

    it("passes csrf token on render view initiation", () => {
      submitAdaptor.renderClientDeclarationForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(argsObject.csrfToken, "abcdefg");
    });

    it("passes session input data to render view initiation", () => {
      requestStub.session.clientFirstName = "Test";
      requestStub.session.clientLastName = "User";

      submitAdaptor.renderClientDeclarationForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as unknown as Record<string, any>;

      assert.equal(argsObject.clientDetails.firstName, "Test");
      assert.equal(argsObject.clientDetails.lastName, "User");
    });
  });

  describe("processClientDeclarationForm", () => {
    it("redirects to confirmation success", () => {
      submitAdaptor.processClientDeclarationForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(redirectArgs[0], "/apply/confirmation/success");
    });
  });
});
