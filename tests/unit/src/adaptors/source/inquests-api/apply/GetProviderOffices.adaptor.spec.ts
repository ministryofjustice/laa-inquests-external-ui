import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { GetProviderOfficesAdaptor } from "#src/adaptors/source/inquests-api/apply/GetProviderOffices/GetProviderOffices.adaptor.js";

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

  it("throws when access token is missing", async () => {
    await assert.rejects(
      async () => adaptor.getProviderOffices("123", undefined),
      /Missing access token/,
    );
  });

  it("propagates errors when the API request fails", async () => {
    axiosStub.get.rejects(new Error("Network error"));

    await assert.rejects(
      async () => adaptor.getProviderOffices("123", "access-token-123"),
      /Network error/,
    );
  });
});
