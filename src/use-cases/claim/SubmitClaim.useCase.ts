import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import {
  CLAIM_SUBMIT_ERROR,
  SUBMIT_CLAIM_FALLBACK_ERROR,
  TOTAL_CLAIM_ERROR,
} from "#src/infrastructure/locales/constants.js";

export interface SubmitClaimInput {
  laaReference: string;
  claimType: string;
  poaTypeId: string | null | undefined;
  claimantId: string;
  accessToken: string | undefined;
  zeroVatTotal: number | null | undefined;
  netTotal: number | null | undefined;
  grossTotal: number | null;
  claimEvidenceIds?: string[];
  inquestOutcomes?: string[];
  claimCostTemplateFile?: {
    claimCostTemplateFileId: string;
    claimCostTemplateFileName: string;
  } | null;
  hasCounselBeenPaid?: boolean | null;
  hasAlternativeFunding?: boolean | null;
  hasRecoveryCostsAwarded?: boolean | null;
  financialRecoveryPreviousPreCertificateCosts?: number | null;
  financialRecoveryCost?: number | null;
  financialRecoveryDamages?: number | null;
  financialRecoveryInterest?: number | null;
  payingParty?: string | null;
  numberOfCounselInstructed?: string | null;
}

interface SubmitClaimSuccess {
  claimId: number;
  rejectionReasons?: string[];
}

export interface SubmitClaimErrorSummaries {
  submitError: { text: string };
}

export type SubmitClaimResult =
  | { status: "SUCCESS"; data: SubmitClaimSuccess }
  | {
      status: "VALIDATION_FAILED";
      errorSummaries: SubmitClaimErrorSummaries;
    };

export class SubmitClaimUseCase {
  constructor(private readonly claimSubmitPort: ClaimSubmitPort) {}

  async execute(input: SubmitClaimInput): Promise<SubmitClaimResult> {
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
        inquestOutcomes: input.inquestOutcomes,
        claimCostTemplateFile: input.claimCostTemplateFile,
        hasCounselBeenPaid: input.hasCounselBeenPaid,
        hasAlternativeFunding: input.hasAlternativeFunding,
        hasRecoveryCostsAwarded: input.hasRecoveryCostsAwarded,
        financialRecoveryPreviousPreCertificateCosts:
          input.financialRecoveryPreviousPreCertificateCosts,
        financialRecoveryCost: input.financialRecoveryCost,
        financialRecoveryDamages: input.financialRecoveryDamages,
        financialRecoveryInterest: input.financialRecoveryInterest,
        payingParty: input.payingParty,
        numberOfCounselInstructed: input.numberOfCounselInstructed,
      },
      input.accessToken,
    );

    if (result.status === "UNPROCESSABLE") {
      const text = this.#resolveErrorText(result.errorCode);
      return {
        status: "VALIDATION_FAILED",
        errorSummaries: { submitError: { text } },
      };
    } else if (result.status === "REJECTED") {
      return {
        status: "SUCCESS",
        data: {
          claimId: result.data.claimId,
          rejectionReasons: result.data.rejectionReasons,
        },
      };
    } else {
      return { status: "SUCCESS", data: { claimId: result.data.claimId } };
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
