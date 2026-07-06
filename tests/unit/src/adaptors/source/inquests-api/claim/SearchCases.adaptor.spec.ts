import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { SearchCasesAdaptor } from "#src/adaptors/source/inquests-api/claim/SearchCases/SearchCases.adaptor.js";

describe("SearchCasesAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: SearchCasesAdaptor;

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.get.resolves({
      status: 200,
      data: [
        {
          laaReference: 1,
          clientName: "Jane Smith",
          clientDateOfBirth: "2000-01-01",
          dateSubmitted: "2026-06-30T15:59:32.622897",
          firmName: "Test Firm",
          firmNumber: "0A123B",
          overallDecision: "GRANTED",
        },
      ],
    });

    adaptor = new SearchCasesAdaptor(axiosStub, "http://localhost");
  });

  it("returns cases from the API response", async () => {
    const result = await adaptor.searchCases(
      { laaReference: "1" },
      "access-token-123",
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].laaReference, 1);
    assert.equal(result[0].clientName, "Jane Smith");
  });

  it("calls the correct API endpoint with laa_reference query param and auth header", async () => {
    await adaptor.searchCases({ laaReference: "ABC-123" }, "access-token-123");

    assert(axiosStub.get.calledOnce);

    const getCall = axiosStub.get.getCall(0);
    assert.equal(getCall.args[0], "http://localhost/applications/search");
    assert.deepEqual(getCall.args[1], {
      params: { laa_reference: "ABC-123" },
      headers: { Authorization: "Bearer access-token-123" },
    });
  });

  it("throws when access token is missing", async () => {
    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, undefined),
      /Missing access token/,
    );
  });

  it("throws when access token is an empty string", async () => {
    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, ""),
      /Missing access token/,
    );
  });
});
