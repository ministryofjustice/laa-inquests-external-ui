import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import {
  CLAIM_SUBMIT_ERROR,
  SUBMIT_CLAIM_FALLBACK_ERROR,
  TOTAL_CLAIM_ERROR,
} from "#src/infrastructure/locales/constants.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export interface SubmitClaimInput {
  laaReference: string;
  claimType: string;
  poaTypeId: string | null;
  claimantId: string;
  accessToken: string | undefined;
  zeroVatTotal: number | null;
  netTotal: number | null;
  grossTotal: number | null;
  claimEvidenceIds: string[];
}

interface SubmitClaimSuccess {
  claimId: number;
  rejectionReasons?: string[];
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
          claimEvidenceIds: input.claimEvidenceIds,
        },
        input.accessToken,
      );

      if (result.status === "UNPROCESSABLE") {
        const text = this.#resolveErrorText(result.errorCode);
        logger.logWarn({
          functionName: "submitClaimUseCase_execute",
          message: "Claim submission failed validation",
          extraContext: {
            event: "claim_submission_failed",
            reason: "VALIDATION_FAILED",
            error_code: result.errorCode,
            laa_reference: input.laaReference,
          },
        });
        return {
          status: "VALIDATION_FAILED",
          errorSummaries: { submitError: { text } },
        };
      } else if (result.status === "REJECTED") {
        logger.logInfo({
          functionName: "submitClaimUseCase_execute",
          message: "Claim submission completed with rejection reasons",
          extraContext: {
            event: "claim_submission_completed",
            outcome: "REJECTED",
            laa_reference: input.laaReference,
            rejection_reason_count: result.data.rejectionReasons.length,
          },
        });
        return {
          status: "SUCCESS",
          data: {
            claimId: result.data.claimId,
            rejectionReasons: result.data.rejectionReasons,
          },
        };
      } else {
        logger.logInfo({
          functionName: "submitClaimUseCase_execute",
          message: "Claim submission completed successfully",
          extraContext: {
            event: "claim_submission_completed",
            laa_reference: input.laaReference,
            outcome: "SUCCESS",
          },
        });
        return { status: "SUCCESS", data: { claimId: result.data.claimId } };
      }
    } catch (err) {
      logger.logError({
        functionName: "submitClaimUseCase_execute",
        message: "Claim submission failed with exception",
        err,
        extraContext: {
          event: "claim_submission_failed",
          reason: "UNEXPECTED_EXCEPTION",
          laa_reference: input.laaReference
        },
      });
      return { status: "TECHNICAL_FAILURE", reason: "UNEXPECTED_EXCEPTION" };
    }
  }

  #resolveErrorText(errorCode: string): string {
    if (errorCode in TOTAL_CLAIM_ERROR) {
      return TOTAL_CLAIM_ERROR[errorCode as keyof typeof TOTAL_CLAIM_ERROR];
    }
    if (errorCode in CLAIM_SUBMIT_ERROR) {
      return CLAIM_SUBMIT_ERROR[errorCode as keyof typeof CLAIM_SUBMIT_ERROR];
    }
    return SUBMIT_CLAIM_FALLBACK_ERROR;
  }
}
