import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import { CONFIRM_CLAIM_PLACEHOLDER } from "#src/infrastructure/locales/constants.js";

export interface SubmitClaimInput {
  laaReference: string;
  claimType: string;
  poaTypeId: string;
  claimantId: string;
  accessToken: string | undefined;
}

interface SubmitClaimSuccess {
  claimId: number;
}

export class SubmitClaimUseCase {
  constructor(private readonly claimSubmitPort: ClaimSubmitPort) {}

  async execute(
    input: SubmitClaimInput,
  ): Promise<UseCaseResult<SubmitClaimSuccess>> {
    try {
      const response = await this.claimSubmitPort.submitClaim(
        input.laaReference,
        {
          claimType: input.claimType,
          totalProfitCostNet: CONFIRM_CLAIM_PLACEHOLDER.NET_TOTAL_VALUE,
          totalProfitCostGross: CONFIRM_CLAIM_PLACEHOLDER.GROSS_TOTAL_VALUE,
          poaTypeId: input.poaTypeId,
          claimantId: input.claimantId,
        },
        input.accessToken,
      );
      return { status: "SUCCESS", data: { claimId: response.claimId } };
    } catch {
      return { status: "TECHNICAL_FAILURE", reason: "UNEXPECTED_EXCEPTION" };
    }
  }
}
