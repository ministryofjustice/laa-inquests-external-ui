import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { CaseSearchAdaptor } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.adaptor.js";
import { CaseSearchValidator } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.validator.js";
import { CASE_SEARCH_ERROR } from "#src/infrastructure/locales/constants.js";

describe("CaseSearch adaptor", () => {
  describe("renderForm", () => {
    it("renders the case search form", () => {
      const validator = new CaseSearchValidator();
      const adaptor = new CaseSearchAdaptor(validator);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/case-search");
      assert.equal(
        (renderArgs[1] as unknown as Record<string, unknown>).csrfToken,
        "test-token",
      );
    });
  });

  describe("processForm", () => {
    it("re-renders form with error when case reference is empty", () => {
      const validator = new CaseSearchValidator();
      const adaptor = new CaseSearchAdaptor(validator);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "case-reference": "" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/case-search");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          caseReferenceInputError: {
            text: CASE_SEARCH_ERROR.MISSING_CASE_REFERENCE,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("redirects to /claim/results when case reference is provided", () => {
      const validator = new CaseSearchValidator();
      const adaptor = new CaseSearchAdaptor(validator);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "case-reference": "ABC-12345" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/results");
      assert.equal(responseStub.render.callCount, 0);
    });
  });

  describe("renderResults", () => {
    it("renders the case search results page", () => {
      const validator = new CaseSearchValidator();
      const adaptor = new CaseSearchAdaptor(validator);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      adaptor.renderResults(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/case-search-results");
    });
  });
});
