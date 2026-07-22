import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { SubmitClaimAdaptor } from "#src/adaptors/source/inquests-api/claim/SubmitClaim/SubmitClaim.adaptor.js";
import { HTTP_UNPROCESSABLE_CONTENT } from "#src/infrastructure/locales/constants.js";

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

  const rejectedMockResponse = {
    claimId: 2,
    laaReference: 1,
    claimTypeId: "PAYMENT_ON_ACCOUNT",
    statusId: "REJECTED",
    submissionDate: "2026-07-07T12:25:08.407881",
    totalProfitCostNet: 1000,
    totalProfitCostGross: 1200,
    claimantId: "claimant-123@provider.co.uk",
    poaTypeId: "PROFIT_COST",
    rejectionReasons: ["MAX_POA_CLAIMS_EXCEEDED"],
  };

  const rejectedUnknownCodeResponse = {
    claimId: 3,
    laaReference: 1,
    claimTypeId: "PAYMENT_ON_ACCOUNT",
    statusId: "REJECTED",
    submissionDate: "2026-07-07T12:25:08.407881",
    totalProfitCostNet: 1000,
    totalProfitCostGross: 1200,
    claimantId: "claimant-123@provider.co.uk",
    poaTypeId: "PROFIT_COST",
    rejectionReasons: ["UNLISTED_REJECTION_REASON_CODE"],
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
        totalProfitCostVatZero: 100,
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
        totalProfitCostVatZero: 100,
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
      totalProfitCostVatZero: 100,
      totalProfitCostNet: 1000,
      totalProfitCostGross: 1200,
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
    };

    await adaptor.submitClaim("12345", body, "access-token-123");

    const postCall = axiosStub.post.getCall(0);
    assert.deepEqual(postCall.args[1], body);
  });

  it("returns a CREATED result with the response data when the API call succeeds", async () => {
    const result = await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostVatZero: 100,
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert.equal(result.status, "CREATED");
    assert.deepEqual(
      (result as { status: string; data: typeof mockResponse }).data,
      mockResponse,
    );
  });

  it("returns an UNPROCESSABLE result with the errorCode when the API responds with 422", async () => {
    const axiosError = {
      response: {
        status: HTTP_UNPROCESSABLE_CONTENT,
        data: { errorCode: "NET_TOTAL_HIGHER_THAN_GROSS_TOTAL" },
      },
    };
    axiosStub.post.rejects(axiosError);

    const result = await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostVatZero: 100,
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert.equal(result.status, "UNPROCESSABLE");
    assert.equal(
      (result as { status: string; errorCode: string }).errorCode,
      "NET_TOTAL_HIGHER_THAN_GROSS_TOTAL",
    );
  });

  it("returns an UNPROCESSABLE result with an empty errorCode when the 422 body is unrecognised", async () => {
    const axiosError = {
      response: {
        status: HTTP_UNPROCESSABLE_CONTENT,
        data: { unexpected: "shape" },
      },
    };
    axiosStub.post.rejects(axiosError);

    const result = await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostVatZero: 100,
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert.equal(result.status, "UNPROCESSABLE");
    assert.equal(
      (result as { status: string; errorCode: string }).errorCode,
      "",
    );
  });

  it("returns a REJECTED result when the API responds with statusId REJECTED and known rejection reasons", async () => {
    axiosStub.post.resolves({ status: 201, data: rejectedMockResponse });

    const result = await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostVatZero: 100,
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert.equal(result.status, "REJECTED");
    assert.deepEqual(
      (
        result as {
          status: string;
          data: { claimId: number; rejectionReasons: string[] };
        }
      ).data,
      {
        claimId: 2,
        rejectionReasons: ["MAX_POA_CLAIMS_EXCEEDED"],
      },
    );
  });

  it("returns a REJECTED result when the API responds with statusId REJECTED and unknown rejection reasons", async () => {
    axiosStub.post.resolves({ status: 201, data: rejectedUnknownCodeResponse });

    const result = await adaptor.submitClaim(
      "12345",
      {
        claimType: "PAYMENT_ON_ACCOUNT",
        totalProfitCostVatZero: 100,
        totalProfitCostNet: 1000,
        totalProfitCostGross: 1200,
        poaTypeId: "PROFIT_COST",
        claimantId: "test@provider.co.uk",
      },
      "access-token-123",
    );

    assert.equal(result.status, "REJECTED");
    assert.deepEqual(
      (
        result as {
          status: string;
          data: { claimId: number; rejectionReasons: string[] };
        }
      ).data,
      {
        claimId: 3,
        rejectionReasons: ["UNLISTED_REJECTION_REASON_CODE"],
      },
    );
  });

  it("re-throws non-422 errors", async () => {
    axiosStub.post.rejects(new Error("Network error"));

    await assert.rejects(
      async () =>
        adaptor.submitClaim(
          "12345",
          {
            claimType: "PAYMENT_ON_ACCOUNT",
            totalProfitCostVatZero: 100,
            totalProfitCostNet: 1000,
            totalProfitCostGross: 1200,
            poaTypeId: "PROFIT_COST",
            claimantId: "test@provider.co.uk",
          },
          "access-token-123",
        ),
      /Network error/,
    );
  });

  it("throws when the access token is missing", async () => {
    await assert.rejects(
      async () =>
        adaptor.submitClaim(
          "12345",
          {
            claimType: "PAYMENT_ON_ACCOUNT",
            totalProfitCostVatZero: 100,
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
            totalProfitCostVatZero: 100,
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
