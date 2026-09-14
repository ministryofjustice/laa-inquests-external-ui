import { strict as assert } from "assert";
import axios, { type AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { GetPublicAuthoritiesAdaptor } from "#src/adaptors/source/inquests-api/apply/GetPublicAuthorities/GetPublicAuthorities.adaptor.js";
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

describe("GetPublicAuthoritiesAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: GetPublicAuthoritiesAdaptor;

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    adaptor = new GetPublicAuthoritiesAdaptor(axiosStub, "http://localhost");
  });

  it("returns public bodies from the API response", async () => {
    axiosStub.get.resolves({
      status: 200,
      data: [
        {
          publicBodyId: "Cabinet Office",
          publicBodyDescription: "Cabinet Office",
        },
      ],
    });

    const result = await adaptor.getPublicAuthorities("access-token-123");

    assert.equal(result.length, 1);
    assert.equal(result[0].publicBodyId, "Cabinet Office");
    assert.equal(result[0].publicBodyDescription, "Cabinet Office");
  });

  it("calls the correct API endpoint with auth header", async () => {
    axiosStub.get.resolves({ status: 200, data: [] });

    await adaptor.getPublicAuthorities("access-token-123");

    assert(axiosStub.get.calledOnce);
    const getCall = axiosStub.get.getCall(0);
    assert.equal(
      getCall.args[0],
      "http://localhost/applications/public-bodies",
    );
    assert.deepEqual(getCall.args[1], {
      params: undefined,
      headers: { Authorization: "Bearer access-token-123" },
    });
  });

  it("throws AUTHENTICATION_REQUIRED without calling the API when token is missing", async () => {
    await assert.rejects(
      async () => adaptor.getPublicAuthorities(undefined),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        );
        assert.equal(error.retryable, false);
        assert.equal((error as { cause?: unknown }).cause, undefined);
        return true;
      },
    );
    assert.equal(axiosStub.get.callCount, 0);
  });

  it("throws AUTHENTICATION_REQUIRED on a 401 response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 401 }));

    await assert.rejects(
      async () => adaptor.getPublicAuthorities("token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        );
        assert.equal((error as { cause?: unknown }).cause, undefined);
        return true;
      },
    );
  });

  it("throws FORBIDDEN on a 403 response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 403 }));

    await assert.rejects(
      async () => adaptor.getPublicAuthorities("token"),
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
      async () => adaptor.getPublicAuthorities("token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.type, APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE);
        assert.equal(error.retryable, true);
        return true;
      },
    );
  });

  it("throws retryable UPSTREAM_UNAVAILABLE on a network failure", async () => {
    axiosStub.get.rejects(axiosErrorWith({ code: "ECONNREFUSED" }));

    await assert.rejects(
      async () => adaptor.getPublicAuthorities("token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.type, APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE);
        assert.equal(error.retryable, true);
        return true;
      },
    );
  });

  it("throws INVALID_UPSTREAM_RESPONSE on a malformed payload", async () => {
    axiosStub.get.resolves({
      status: 200,
      data: [{ unexpected: "shape" }],
    });

    await assert.rejects(
      async () => adaptor.getPublicAuthorities("token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(
          error.type,
          APPLICATION_ERROR_TYPES.INVALID_UPSTREAM_RESPONSE,
        );
        assert.equal((error as { cause?: unknown }).cause, undefined);
        return true;
      },
    );
  });

  it("never treats a plain axios error as an axios error type escape", () => {
    // Guard: the helper used by these tests must satisfy axios.isAxiosError.
    assert.equal(axios.isAxiosError(axiosErrorWith({ status: 401 })), true);
  });
});
