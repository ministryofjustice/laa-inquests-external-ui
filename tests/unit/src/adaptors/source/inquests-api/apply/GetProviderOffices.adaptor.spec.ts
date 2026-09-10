import { strict as assert } from "assert";
import axios, { type AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { GetProviderOfficesAdaptor } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/GetProviderOffices.adaptor.js";
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

describe("GetProviderOfficesAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: GetProviderOfficesAdaptor;

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    adaptor = new GetProviderOfficesAdaptor(axiosStub, "http://localhost");
  });

  it("returns provider offices from the API response", async () => {
    axiosStub.get.resolves({
      status: 200,
      data: [
        {
          officeCode: "0A123A",
          address: {
            addressLine1: "1 Test Street",
            addressLine2: "Suite 2",
            townOrCity: "London",
            county: "Greater London",
            postcode: "SW1A 1AA",
          },
        },
      ],
    });

    const result = await adaptor.getProviderOffices("123", "access-token-123");

    assert.equal(result.length, 1);
    assert.equal(result[0].officeCode, "0A123A");
    assert.equal(result[0].address.addressLine1, "1 Test Street");
    assert.equal(result[0].address.postcode, "SW1A 1AA");
  });

  it("calls the correct API endpoint with auth header", async () => {
    axiosStub.get.resolves({ status: 200, data: [] });

    await adaptor.getProviderOffices("123", "access-token-123");

    assert(axiosStub.get.calledOnce);
    const getCall = axiosStub.get.getCall(0);
    assert.equal(
      getCall.args[0],
      "http://localhost/applications/provider-offices/123",
    );
    assert.deepEqual(getCall.args[1], {
      params: undefined,
      headers: { Authorization: "Bearer access-token-123" },
    });
  });

  it("throws AUTHENTICATION_REQUIRED without calling the API when token is missing", async () => {
    await assert.rejects(
      async () => adaptor.getProviderOffices("123", undefined),
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
    assert.equal(axiosStub.get.callCount, 0);
  });

  it("throws AUTHENTICATION_REQUIRED on a 401 response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 401 }));

    await assert.rejects(
      async () => adaptor.getProviderOffices("123", "token"),
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
      async () => adaptor.getProviderOffices("123", "token"),
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
      async () => adaptor.getProviderOffices("123", "token"),
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
      async () => adaptor.getProviderOffices("123", "token"),
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
      data: [{ officeCode: "0A123A" }],
    });

    await assert.rejects(
      async () => adaptor.getProviderOffices("123", "token"),
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

  it("uses an axios error helper that satisfies axios.isAxiosError", () => {
    assert.equal(axios.isAxiosError(axiosErrorWith({ status: 401 })), true);
  });
});
