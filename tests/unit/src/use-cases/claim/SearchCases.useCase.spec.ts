import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { SearchCasesPort } from "#src/ports/source/inquests-api/SearchCases.port.js";
import { SearchCasesUseCase } from "#src/use-cases/claim/SearchCases.useCase.js";

describe("SearchCasesUseCase", () => {
  let searchCasesPort: StubbedInstance<SearchCasesPort>;
  let useCase: SearchCasesUseCase;

  beforeEach(() => {
    searchCasesPort = stubInterface<SearchCasesPort>();
    useCase = new SearchCasesUseCase(searchCasesPort);
  });

  it("returns success with cases when the API responds", async () => {
    const mockCases = [
      {
        laaReference: 1,
        clientName: "Jane Smith",
        clientDateOfBirth: "2000-01-01",
        dateSubmitted: "2026-06-30T15:59:32.622897",
        firmName: "test firm",
        firmNumber: "0A123B",
        overallDecision: "GRANTED",
      },
    ];
    searchCasesPort.searchCases.resolves(mockCases);

    const result = await useCase.execute("1", "access-token-123");
  });

  it("returns success with empty array when API returns no results", async () => {
    searchCasesPort.searchCases.resolves([]);

    const result = await useCase.execute("1", "access-token-123");

    assert.equal(result.status, "SUCCESS");
    assert.deepEqual(result.data, []);
  });

  it("calls searchCasesPort with the correct laa reference", async () => {
    searchCasesPort.searchCases.resolves([]);

    await useCase.execute("ABC-123", "access-token-123");

    assert.equal(
      searchCasesPort.searchCases.calledOnceWith(
        { laaReference: "ABC-123" },
        "access-token-123",
      ),
      true,
    );
  });

  it("returns TECHNICAL_FAILURE when the API throws", async () => {
    searchCasesPort.searchCases.rejects(new Error("Network error"));

    const result = await useCase.execute("1", "access-token-123");

    assert.equal(result.status, "TECHNICAL_FAILURE");
    assert.equal(
      (result as { status: string; reason: string }).reason,
      "UNEXPECTED_EXCEPTION",
    );
  });
});
