import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { GetPublicAuthoritiesAdaptor } from "#src/adaptors/source/inquests-api/apply/GetPublicAuthorities/GetPublicAuthorities.adaptor.js";

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

  it("throws when access token is missing", async () => {
    await assert.rejects(
      async () => adaptor.getPublicAuthorities(undefined),
      /Missing access token/,
    );
  });
});
