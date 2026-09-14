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

  it("returns the cases from the port when the API responds", async () => {
    const mockCases = [
      {
        laaReference: "1",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        clientDateOfBirth: "2000-01-01",
        dateSubmitted: "2026-06-30T15:59:32.622897",
        firmName: "test firm",
        firmNumber: "0A123B",
        overallDecision: "GRANTED",
      },
    ];
    searchCasesPort.searchCases.resolves(mockCases);

    const result = await useCase.execute("1", "access-token-123");

    assert.deepEqual(result, mockCases);
  });

  it("returns an empty array when API returns no results", async () => {
    searchCasesPort.searchCases.resolves([]);

    const result = await useCase.execute("1", "access-token-123");

    assert.deepEqual(result, []);
  });

  it("calls searchCasesPort with the correct laa reference", async () => {
    searchCasesPort.searchCases.resolves([]);

    await useCase.execute("ABC-123", "access-token-123");

    assert.equal(
      searchCasesPort.searchCases.calledOnceWith(
        { laaReference: "ABC-123", meritsDecision: undefined },
        "access-token-123",
      ),
      true,
    );
  });

  it("calls searchCasesPort with meritsDecision when provided", async () => {
    searchCasesPort.searchCases.resolves([]);

    await useCase.execute("ABC-123", "access-token-123", "GRANTED");

    assert.equal(
      searchCasesPort.searchCases.calledOnceWith(
        { laaReference: "ABC-123", meritsDecision: "GRANTED" },
        "access-token-123",
      ),
      true,
    );
  });

  it("propagates the port error unchanged", async () => {
    const portError = new Error("Network error");
    searchCasesPort.searchCases.rejects(portError);

    await assert.rejects(
      async () => useCase.execute("1", "access-token-123"),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
