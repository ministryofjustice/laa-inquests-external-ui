import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import {
  SUBMIT_CLAIM_FALLBACK_ERROR,
  TOTAL_CLAIM_ERROR,
} from "#src/infrastructure/locales/constants.js";

export interface SubmitClaimInput {
  laaReference: string;
  claimType: string;
  poaTypeId: string;
  claimantId: string;
  accessToken: string | undefined;
  zeroVatTotal: number | null;
  netTotal: number | null;
  grossTotal: number | null;
}

interface SubmitClaimSuccess {
  claimId: number;
}

export interface SubmitClaimErrorSummaries {
  submitError: { text: string };
}

export class SubmitClaimUseCase {
  constructor(private readonly claimSubmitPort: ClaimSubmitPort) {}

  async execute(
    input: SubmitClaimInput,
  ): Promise<UseCaseResult<SubmitClaimSuccess, SubmitClaimErrorSummaries>> {
    try {
      const result = await this.claimSubmitPort.submitClaim(
        input.laaReference,
        {
          claimType: input.claimType,
          totalProfitCostVatZero: input.zeroVatTotal,
          totalProfitCostNet: input.netTotal,
          totalProfitCostGross: input.grossTotal,
          poaTypeId: input.poaTypeId,
          claimantId: input.claimantId,
        },
        input.accessToken,
      );

      if (result.status === "UNPROCESSABLE") {
        const text =
          result.errorCode in TOTAL_CLAIM_ERROR
            ? TOTAL_CLAIM_ERROR[
                result.errorCode as keyof typeof TOTAL_CLAIM_ERROR
              ]
            : SUBMIT_CLAIM_FALLBACK_ERROR;
        return {
          status: "VALIDATION_FAILED",
          errorSummaries: { submitError: { text } },
        };
      }

      return { status: "SUCCESS", data: { claimId: result.data.claimId } };
    } catch {
      return { status: "TECHNICAL_FAILURE", reason: "UNEXPECTED_EXCEPTION" };
    }
  }
}
