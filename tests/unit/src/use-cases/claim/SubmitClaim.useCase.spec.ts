import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import { SubmitClaimUseCase } from "#src/use-cases/claim/SubmitClaim.useCase.js";
import {
  SUBMIT_CLAIM_FALLBACK_ERROR,
  TOTAL_CLAIM_ERROR,
} from "#src/infrastructure/locales/constants.js";

describe("SubmitClaimUseCase", () => {
  let claimSubmitPort: StubbedInstance<ClaimSubmitPort>;
  let useCase: SubmitClaimUseCase;

  const mockApiResponse = { claimId: 42 };

  beforeEach(() => {
    claimSubmitPort = stubInterface<ClaimSubmitPort>();
    claimSubmitPort.submitClaim.resolves({
      status: "CREATED",
      data: mockApiResponse,
    });
    useCase = new SubmitClaimUseCase(claimSubmitPort);
  });

  it("returns SUCCESS with claimId when the API call succeeds", async () => {
    const result = await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 0,
      netTotal: 1000,
      grossTotal: 1200,
    });

    assert.equal(result.status, "SUCCESS");
    assert.equal(
      (result as { status: string; data: { claimId: number } }).data.claimId,
      42,
    );
  });

  it("calls submitClaim with the totals from input", async () => {
    await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 25,
      netTotal: 1000,
      grossTotal: 1225,
    });

    assert(claimSubmitPort.submitClaim.calledOnce);
    const [, body] = claimSubmitPort.submitClaim.getCall(0).args;
    assert.equal(body.totalProfitCostVatZero, 25);
    assert.equal(body.totalProfitCostNet, 1000);
    assert.equal(body.totalProfitCostGross, 1225);
  });

  it("calls submitClaim with the correct laaReference, claimType, poaTypeId and claimantId", async () => {
    await useCase.execute({
      laaReference: "99",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "EXPERT_COST",
      claimantId: "solicitor@firm.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 10,
      netTotal: 500,
      grossTotal: 610,
    });

    assert(claimSubmitPort.submitClaim.calledOnce);
    const [laaRef, body, token] = claimSubmitPort.submitClaim.getCall(0).args;
    assert.equal(laaRef, "99");
    assert.equal(body.claimType, "PAYMENT_ON_ACCOUNT");
    assert.equal(body.poaTypeId, "EXPERT_COST");
    assert.equal(body.claimantId, "solicitor@firm.co.uk");
    assert.equal(body.totalProfitCostVatZero, 10);
    assert.equal(body.totalProfitCostNet, 500);
    assert.equal(body.totalProfitCostGross, 610);
    assert.equal(token, "access-token-123");
  });

  it("returns TECHNICAL_FAILURE when the port throws", async () => {
    claimSubmitPort.submitClaim.rejects(new Error("Network error"));

    const result = await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 0,
      netTotal: 1000,
      grossTotal: 1200,
    });

    assert.equal(result.status, "TECHNICAL_FAILURE");
    assert.equal(
      (result as { status: string; reason: string }).reason,
      "UNEXPECTED_EXCEPTION",
    );
  });

  it("returns VALIDATION_FAILED with mapped error text when the port returns UNPROCESSABLE with a known error code", async () => {
    claimSubmitPort.submitClaim.resolves({
      status: "UNPROCESSABLE",
      errorCode: "NET_TOTAL_HIGHER_THAN_GROSS_TOTAL",
    });

    const result = await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 0,
      netTotal: 1000,
      grossTotal: 1200,
    });

    assert.equal(result.status, "VALIDATION_FAILED");
    assert.deepEqual(
      (
        result as {
          status: string;
          errorSummaries: { submitError: { text: string } };
        }
      ).errorSummaries,
      {
        submitError: {
          text: TOTAL_CLAIM_ERROR.NET_TOTAL_HIGHER_THAN_GROSS_TOTAL,
        },
      },
    );
  });

  it("returns VALIDATION_FAILED with fallback text when the port returns UNPROCESSABLE with an unknown error code", async () => {
    claimSubmitPort.submitClaim.resolves({
      status: "UNPROCESSABLE",
      errorCode: "UNKNOWN_CODE",
    });

    const result = await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 0,
      netTotal: 1000,
      grossTotal: 1200,
    });

    assert.equal(result.status, "VALIDATION_FAILED");
    assert.deepEqual(
      (
        result as {
          status: string;
          errorSummaries: { submitError: { text: string } };
        }
      ).errorSummaries,
      { submitError: { text: SUBMIT_CLAIM_FALLBACK_ERROR } },
    );
  });

  it("returns SUCCESS with rejection reasons when the port returns REJECTED", async () => {
    claimSubmitPort.submitClaim.resolves({
      status: "REJECTED",
      data: {
        claimId: 42,
        rejectionReasons: [
          "MAX_POA_CLAIMS_EXCEEDED",
          "UNLISTED_REJECTION_REASON_CODE",
        ],
      },
    });

    const result = await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
      zeroVatTotal: 0,
      netTotal: 1000,
      grossTotal: 1200,
    });

    assert.equal(result.status, "SUCCESS");
    assert.deepEqual(
      (
        result as {
          status: string;
          data: { claimId: number; rejectionReasons: string[] };
        }
      ).data,
      {
        claimId: 42,
        rejectionReasons: [
          "MAX_POA_CLAIMS_EXCEEDED",
          "UNLISTED_REJECTION_REASON_CODE",
        ],
      },
    );
  });
});
