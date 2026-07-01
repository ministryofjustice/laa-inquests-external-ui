import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { CaseSearchAdaptor } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.adaptor.js";
import { CaseSearchValidator } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.validator.js";
import { CaseSearchFormatter } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.formatter.js";
import { CASE_SEARCH_ERROR } from "#src/infrastructure/locales/constants.js";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import { SearchCasesUseCase } from "#src/use-cases/claim/SearchCases.useCase.js";

function buildAdaptor(searchCasesPort?: SearchCasesPort): CaseSearchAdaptor {
  const validator = new CaseSearchValidator();
  const port = searchCasesPort ?? stubInterface<SearchCasesPort>();
  return new CaseSearchAdaptor(validator, port);
}

describe("CaseSearch adaptor", () => {
  describe("renderForm", () => {
    it("renders the case search form", () => {
      const adaptor = buildAdaptor();

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
      const adaptor = buildAdaptor();

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

    it("saves case reference to session and redirects to /claim/results when valid", () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "case-reference": "ABC-12345" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claimCaseReference, "ABC-12345");
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/results");
      assert.equal(responseStub.render.callCount, 0);
    });
  });

  describe("renderResults", () => {
    it("renders case search results when use case succeeds", async () => {
      const mockCase = {
        laaReference: 1,
        clientName: "Jane Smith",
        clientDateOfBirth: "2000-01-01",
        dateSubmitted: "2026-06-30T15:59:32.622897",
        firmName: "test firm",
        firmNumber: "0A123B",
        overallDecision: "GRANTED",
      };
      const searchCasesUseCase = stubInterface<SearchCasesUseCase>();
      searchCasesUseCase.execute.resolves({
        status: "SUCCESS",
        data: [mockCase],
      });

      const validator = new CaseSearchValidator();
      const port = stubInterface<SearchCasesPort>();
      const formatter = new CaseSearchFormatter();
      const adaptor = new CaseSearchAdaptor(
        validator,
        port,
        formatter,
        searchCasesUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claimCaseReference = "1";

      await adaptor.renderResults(requestStub, responseStub);

      assert.equal(
        searchCasesUseCase.execute.calledOnceWith("1"),
        true,
      );
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/case-search-results");
    });

    it("does not render when use case returns TECHNICAL_FAILURE", async () => {
      const searchCasesUseCase = stubInterface<SearchCasesUseCase>();
      searchCasesUseCase.execute.resolves({
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      });

      const validator = new CaseSearchValidator();
      const port = stubInterface<SearchCasesPort>();
      const adaptor = new CaseSearchAdaptor(
        validator,
        port,
        new CaseSearchFormatter(),
        searchCasesUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claimCaseReference = "1";

      await adaptor.renderResults(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 0);
    });

    it("renders results with null firm name as empty string", async () => {
      const mockCase = {
        laaReference: 2,
        clientName: "John Doe",
        clientDateOfBirth: "1990-05-15",
        dateSubmitted: "2026-06-30T10:00:00.000000",
        firmName: null,
        firmNumber: "0B456C",
        overallDecision: "REFUSED",
      };
      const searchCasesUseCase = stubInterface<SearchCasesUseCase>();
      searchCasesUseCase.execute.resolves({
        status: "SUCCESS",
        data: [mockCase],
      });

      const validator = new CaseSearchValidator();
      const port = stubInterface<SearchCasesPort>();
      const formatter = new CaseSearchFormatter();
      const adaptor = new CaseSearchAdaptor(
        validator,
        port,
        formatter,
        searchCasesUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claimCaseReference = "2";

      await adaptor.renderResults(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const rows = (
        renderArgs[1] as unknown as { cases: { firmNameAndNumber: string }[] }
      ).cases;
      assert.equal(rows[0].firmNameAndNumber, "0B456C");
    });

    it("renders results with empty cases array when API returns no results", async () => {
      const searchCasesUseCase = stubInterface<SearchCasesUseCase>();
      searchCasesUseCase.execute.resolves({
        status: "SUCCESS",
        data: [],
      });

      const validator = new CaseSearchValidator();
      const port = stubInterface<SearchCasesPort>();
      const adaptor = new CaseSearchAdaptor(
        validator,
        port,
        new CaseSearchFormatter(),
        searchCasesUseCase,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.claimCaseReference = "UNKNOWN-123";

      await adaptor.renderResults(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/case-search-results");
      const cases = (renderArgs[1] as unknown as { cases: unknown[] }).cases;
      assert.deepEqual(cases, []);
    });
  });
});
