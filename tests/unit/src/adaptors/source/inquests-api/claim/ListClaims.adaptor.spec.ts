import { strict as assert } from "assert";
import axios, { type AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { ListClaimsAdaptor } from "#src/adaptors/source/inquests-api/claim/ListClaims/ListClaims.adaptor.js";
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

describe("ListClaimsAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: ListClaimsAdaptor;

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.get.resolves({
      status: 200,
      data: [{ claimTypeId: "FINAL_BILL", statusId: "SUBMITTED" }],
    });

    adaptor = new ListClaimsAdaptor(axiosStub, "http://localhost");
  });

  it("returns the claims from the API response", async () => {
    const result = await adaptor.listClaims("INQ-1", false, "access-token-123");

    assert.equal(result.length, 1);
    assert.equal(result[0].claimTypeId, "FINAL_BILL");
    assert.equal(result[0].statusId, "SUBMITTED");
  });

  it("calls the claims endpoint with assessed query param and auth header", async () => {
    await adaptor.listClaims("INQ-1", false, "access-token-123");

    assert(axiosStub.get.calledOnce);

    const getCall = axiosStub.get.getCall(0);
    assert.equal(
      getCall.args[0],
      "http://localhost/applications/INQ-1/claims",
    );
    assert.deepEqual(getCall.args[1], {
      params: { assessed: "false" },
      headers: { Authorization: "Bearer access-token-123" },
    });
  });

  it("passes assessed=true when requested", async () => {
    await adaptor.listClaims("INQ-1", true, "access-token-123");

    const getCall = axiosStub.get.getCall(0);
    assert.deepEqual(getCall.args[1], {
      params: { assessed: "true" },
      headers: { Authorization: "Bearer access-token-123" },
    });
  });

  it("throws AUTHENTICATION_REQUIRED without calling the API when token is missing", async () => {
    await assert.rejects(
      async () => adaptor.listClaims("INQ-1", false, undefined),
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

  it("throws AUTHENTICATION_REQUIRED on a 401 response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 401 }));

    await assert.rejects(
      async () => adaptor.listClaims("INQ-1", false, "token"),
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
      async () => adaptor.listClaims("INQ-1", false, "token"),
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
      async () => adaptor.listClaims("INQ-1", false, "token"),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.type, APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE);
        assert.equal(error.retryable, true);
        return true;
      },
    );
  });

  it("throws INVALID_UPSTREAM_RESPONSE on a malformed payload", async () => {
    axiosStub.get.resolves({ status: 200, data: [{ claimTypeId: 123 }] });

    await assert.rejects(
      async () => adaptor.listClaims("INQ-1", false, "token"),
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
