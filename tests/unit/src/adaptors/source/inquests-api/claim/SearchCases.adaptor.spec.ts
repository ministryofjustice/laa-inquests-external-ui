import { strict as assert } from "assert";
import axios, { type AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { SearchCasesAdaptor } from "#src/adaptors/source/inquests-api/claim/SearchCases/SearchCases.adaptor.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";

function axiosErrorWith(options: { status?: number; code?: string }): unknown {
  return Object.assign(new Error("upstream failure"), {
    isAxiosError: true,
    code: options.code,
    response:
      options.status === undefined ? undefined : { status: options.status },
  });
}

describe("SearchCasesAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: SearchCasesAdaptor;

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.get.resolves({
      status: 200,
      data: [
        {
          laaReference: "1",
          clientFirstName: "Jane",
          clientLastName: "Smith",
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
    assert.equal(result[0].laaReference, "1");
    assert.equal(result[0].clientFirstName, "Jane");
    assert.equal(result[0].clientLastName, "Smith");
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

  it("includes merits_decision query param when provided", async () => {
    await adaptor.searchCases(
      { laaReference: "ABC-123", meritsDecision: "GRANTED" },
      "access-token-123",
    );

    assert(axiosStub.get.calledOnce);

    const getCall = axiosStub.get.getCall(0);
    assert.deepEqual(getCall.args[1], {
      params: { laa_reference: "ABC-123", merits_decision: "GRANTED" },
      headers: { Authorization: "Bearer access-token-123" },
    });
  });

  it("throws AUTHENTICATION_REQUIRED without calling the API when token is missing", async () => {
    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, undefined),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        );
        return true;
      },
    );
    assert.equal(axiosStub.get.callCount, 0);
  });

  it("throws AUTHENTICATION_REQUIRED when the access token is an empty string", async () => {
    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, ""),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        );
        return true;
      },
    );
  });

  it("throws AUTHENTICATION_REQUIRED on a 401 response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 401 }));

    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, "token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        );
        return true;
      },
    );
  });

  it("throws FORBIDDEN on a 403 response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 403 }));

    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, "token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.type, APPLICATION_ERROR_TYPES.FORBIDDEN);
        return true;
      },
    );
  });

  it("throws retryable UPSTREAM_UNAVAILABLE on a 5xx response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 503 }));

    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, "token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.type, APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE);
        assert.equal(error.retryable, true);
        return true;
      },
    );
  });

  it("throws INVALID_UPSTREAM_RESPONSE on a malformed payload", async () => {
    axiosStub.get.resolves({ status: 200, data: [{ laaReference: 123 }] });

    await assert.rejects(
      async () => adaptor.searchCases({ laaReference: "1" }, "token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.INVALID_UPSTREAM_RESPONSE,
        );
        return true;
      },
    );
  });

  it("uses an axios error helper that satisfies axios.isAxiosError", () => {
    assert.equal(axios.isAxiosError(axiosErrorWith({ status: 401 })), true);
  });
});
