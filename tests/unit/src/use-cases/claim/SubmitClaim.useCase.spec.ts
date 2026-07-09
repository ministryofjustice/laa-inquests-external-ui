import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import { SubmitClaimUseCase } from "#src/use-cases/claim/SubmitClaim.useCase.js";
import { CONFIRM_CLAIM_PLACEHOLDER } from "#src/infrastructure/locales/constants.js";

describe("SubmitClaimUseCase", () => {
  let claimSubmitPort: StubbedInstance<ClaimSubmitPort>;
  let useCase: SubmitClaimUseCase;

  const mockApiResponse = {
    claimId: 42,
    laaReference: 1,
    claimTypeId: "PAYMENT_ON_ACCOUNT",
    statusId: "PENDING",
    submissionDate: "2026-07-07T12:25:08.407881",
    totalProfitCostNet: 1000,
    totalProfitCostGross: 1200,
    claimantId: "test@provider.co.uk",
    poaTypeId: "PROFIT_COST",
  };

  beforeEach(() => {
    claimSubmitPort = stubInterface<ClaimSubmitPort>();
    claimSubmitPort.submitClaim.resolves(mockApiResponse);
    useCase = new SubmitClaimUseCase(claimSubmitPort);
  });

  it("returns SUCCESS with claimId when the API call succeeds", async () => {
    const result = await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
    });

    assert.equal(result.status, "SUCCESS");
    assert.equal(
      (result as { status: string; data: { claimId: number } }).data.claimId,
      42,
    );
  });

  it("calls submitClaim with the hardcoded cost values from constants", async () => {
    await useCase.execute({
      laaReference: "1",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "PROFIT_COST",
      claimantId: "test@provider.co.uk",
      accessToken: "access-token-123",
    });

    assert(claimSubmitPort.submitClaim.calledOnce);
    const [, body] = claimSubmitPort.submitClaim.getCall(0).args;
    assert.equal(
      body.totalProfitCostNet,
      CONFIRM_CLAIM_PLACEHOLDER.NET_TOTAL_VALUE,
    );
    assert.equal(
      body.totalProfitCostGross,
      CONFIRM_CLAIM_PLACEHOLDER.GROSS_TOTAL_VALUE,
    );
  });

  it("calls submitClaim with the correct laaReference, claimType, poaTypeId and claimantId", async () => {
    await useCase.execute({
      laaReference: "99",
      claimType: "PAYMENT_ON_ACCOUNT",
      poaTypeId: "EXPERT_COST",
      claimantId: "solicitor@firm.co.uk",
      accessToken: "access-token-123",
    });

    assert(claimSubmitPort.submitClaim.calledOnce);
    const [laaRef, body, token] = claimSubmitPort.submitClaim.getCall(0).args;
    assert.equal(laaRef, "99");
    assert.equal(body.claimType, "PAYMENT_ON_ACCOUNT");
    assert.equal(body.poaTypeId, "EXPERT_COST");
    assert.equal(body.claimantId, "solicitor@firm.co.uk");
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
    });

    assert.equal(result.status, "TECHNICAL_FAILURE");
    assert.equal(
      (result as { status: string; reason: string }).reason,
      "UNEXPECTED_EXCEPTION",
    );
  });
});
