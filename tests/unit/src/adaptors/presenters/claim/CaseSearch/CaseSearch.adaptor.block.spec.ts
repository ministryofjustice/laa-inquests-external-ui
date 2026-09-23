import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { CaseSearchAdaptor } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.adaptor.js";
import { CaseSearchValidator } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.validator.js";
import { CaseSearchFormatter } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.formatter.js";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import { CheckClaimBlockUseCase } from "#src/use-cases/claim/CheckClaimBlock.useCase.js";

const storedClient = {
  reference: "12345",
  clientName: "Jane Smith",
  clientFirstName: "Jane",
  clientLastName: "Smith",
  dateOfBirth: "01/01/2000",
};

function buildAdaptor(checkClaimBlockUseCase: CheckClaimBlockUseCase) {
  return new CaseSearchAdaptor(
    new CaseSearchValidator(),
    stubInterface<SearchCasesPort>(),
    new CaseSearchFormatter(),
    undefined,
    undefined,
    checkClaimBlockUseCase,
  );
}

describe("CaseSearch adaptor - selectCase claim block", () => {
  it("redirects to /claim/type when the claim is not blocked", async () => {
    const checkClaimBlockUseCase = stubInterface<CheckClaimBlockUseCase>();
    checkClaimBlockUseCase.execute.resolves({ status: "ALLOWED" });
    const adaptor = buildAdaptor(checkClaimBlockUseCase);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.params = { reference: "12345" };
    requestStub.session.claim = { searchResults: [storedClient] };
    requestStub.session.accessToken = "access-token-123";

    await adaptor.selectCase(requestStub, responseStub);

    assert.equal(
      checkClaimBlockUseCase.execute.calledOnceWith(
        "12345",
        "access-token-123",
      ),
      true,
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const [redirectUrl] = responseStub.redirect.getCall(0).args;
    assert.equal(redirectUrl, "/claim/type");
    assert.notEqual(requestStub.session.claim?.claimBlocked, true);
  });

  it("redirects to /claim/cannot-claim and flags the session when blocked", async () => {
    const checkClaimBlockUseCase = stubInterface<CheckClaimBlockUseCase>();
    checkClaimBlockUseCase.execute.resolves({ status: "BLOCKED" });
    const adaptor = buildAdaptor(checkClaimBlockUseCase);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.params = { reference: "12345" };
    requestStub.session.claim = { searchResults: [storedClient] };
    requestStub.session.accessToken = "access-token-123";

    await adaptor.selectCase(requestStub, responseStub);

    assert.equal(requestStub.session.claim?.caseReference, "12345");
    assert.equal(requestStub.session.claim?.claimBlocked, true);
    assert.equal(responseStub.redirect.callCount, 1);
    const [redirectUrl] = responseStub.redirect.getCall(0).args;
    assert.equal(redirectUrl, "/claim/cannot-claim");
  });

  it("does not run the block check when the selected case is not found", async () => {
    const checkClaimBlockUseCase = stubInterface<CheckClaimBlockUseCase>();
    const adaptor = buildAdaptor(checkClaimBlockUseCase);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.params = { reference: "does-not-exist" };
    requestStub.session.claim = { searchResults: [] };
    requestStub.session.accessToken = "access-token-123";

    await adaptor.selectCase(requestStub, responseStub);

    assert.equal(checkClaimBlockUseCase.execute.callCount, 0);
    assert.equal(responseStub.redirect.callCount, 1);
    const [redirectUrl] = responseStub.redirect.getCall(0).args;
    assert.equal(redirectUrl, "/claim/results");
  });

  it("propagates a block-check rejection unchanged", async () => {
    const checkClaimBlockUseCase = stubInterface<CheckClaimBlockUseCase>();
    const useCaseError = new Error("upstream unavailable");
    checkClaimBlockUseCase.execute.rejects(useCaseError);
    const adaptor = buildAdaptor(checkClaimBlockUseCase);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.params = { reference: "12345" };
    requestStub.session.claim = { searchResults: [storedClient] };
    requestStub.session.accessToken = "access-token-123";

    await assert.rejects(
      () => adaptor.selectCase(requestStub, responseStub),
      (error: unknown) => {
        assert.equal(error, useCaseError);
        return true;
      },
    );
    assert.equal(responseStub.redirect.callCount, 0);
  });
});
