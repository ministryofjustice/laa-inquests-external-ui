import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { SubmitClaimAdaptor } from "#src/adaptors/source/inquests-api/claim/SubmitClaim/SubmitClaim.adaptor.js";

describe("SubmitClaimAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: SubmitClaimAdaptor;

  const mockResponse = {
    claimId: 1,
    laaReference: 1,
    claimTypeId: "PAYMENT_ON_ACCOUNT",
    statusId: "PENDING",
    submissionDate: "2026-07-07T12:25:08.407881",
    totalProfitCostNet: 1000,
    totalProfitCostGross: 1200,
    claimantId: "claimant-123@provider.co.uk",
    poaTypeId: "PROFIT_COST",
  };

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.post.resolves({ status: 201, data: mockResponse });
    adaptor = new SubmitClaimAdaptor(axiosStub, "http://localhost");
  });

  it("calls the correct API endpoint with the laa reference in the path", async () => {
    await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert(axiosStub.post.calledOnce);
    const postCall = axiosStub.post.getCall(0);
    assert.equal(postCall.args[0], "http://localhost/applications/12345/claim");
  });

  it("sends the correct Authorization header", async () => {
    await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "my-token",
    );

    const postCall = axiosStub.post.getCall(0);
    assert.deepEqual(postCall.args[2], {
      headers: { Authorization: "Bearer my-token" },
    });
  });

  it("sends the correct request body", async () => {
    const body = {
      claimType: "PAYMENT_ON_ACCOUNT",
      totalProfitCostNet: 1000,
      totalProfitCostGross: 1200,
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
    };

    await adaptor.submitClaim("12345", body, "access-token-123");

    const postCall = axiosStub.post.getCall(0);
    assert.deepEqual(postCall.args[1], body);
  });

  it("returns the response data from the API", async () => {
    const result = await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert.deepEqual(result, mockResponse);
  });

  it("throws when the access token is missing", async () => {
    await assert.rejects(
      async () =>
        adaptor.submitClaim(
          "12345",
          {
            claimType: "PAYMENT_ON_ACCOUNT",
            totalProfitCostNet: 1000,
            totalProfitCostGross: 1200,
            poaTypeId: "PROFIT_COST",
            claimantId: "test@provider.co.uk",
          },
          undefined,
        ),
      /Missing access token/,
    );
  });

  it("throws when the access token is an empty string", async () => {
    await assert.rejects(
      async () =>
        adaptor.submitClaim(
          "12345",
          {
            claimType: "PAYMENT_ON_ACCOUNT",
            totalProfitCostNet: 1000,
            totalProfitCostGross: 1200,
            poaTypeId: "PROFIT_COST",
            claimantId: "test@provider.co.uk",
          },
          "",
        ),
      /Missing access token/,
    );
  });
});
