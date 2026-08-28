import type { Request, Response } from "express";
import type { ClaimSession } from "#src/infrastructure/express/session/index.types.js";
import {
  EMPTY_ARR_LENGTH,
  CLAIM_REJECTION_REASON_LABEL,
  CLAIM_SUBTYPE_LABEL,
  CLAIM_TYPE_LABEL,
  CLAIM_TYPE_VALUE,
  COUNSEL_NUMBER_OPTIONS,
  COUNSEL_NUMBER_ZERO,
  FUNDING_POST_INQUEST_OPTIONS,
  FUNDING_POST_INQUEST_VALUE,
  INQUEST_OUTCOME_OPTIONS,
  RECOVERY_COST_OPTIONS,
  RECOVERY_COST_VALUE,
} from "#src/infrastructure/locales/constants.js";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type { Formatter } from "#src/utils/Formatter.js";
import {
  SubmitClaimUseCase,
  type SubmitClaimErrorSummaries,
  type SubmitClaimInput,
} from "#src/use-cases/claim/SubmitClaim.useCase.js";
import { logger as appLogger } from "#src/infrastructure/express/middleware/logger/logger.js";

interface ConfirmAndSubmitUseCases {
  submitClaim: SubmitClaimUseCase;
}

export class ConfirmAndSubmitAdaptor {
  formatter: Formatter;
  submitClaimUseCase: SubmitClaimUseCase;
  logger: (message: string) => void;

  constructor(
    formatter: Formatter,
    claimSubmitPort: ClaimSubmitPort,
    useCases?: Partial<ConfirmAndSubmitUseCases>,
    logger: (message: string) => void = (message) => {
      appLogger.logInfo({ functionName: "ConfirmAndSubmit", message });
    },
  ) {
    this.formatter = formatter;
    this.submitClaimUseCase =
      useCases?.submitClaim ?? new SubmitClaimUseCase(claimSubmitPort);
    this.logger = logger;
  }

  renderForm(req: Request, res: Response): void {
    res.render("claim/check-your-answers", {
      csrfToken: res.locals.csrfToken,
      ...this.#buildRenderData(req),
    });
  }

  async processForm(req: Request, res: Response): Promise<void> {
    const result = await this.submitClaimUseCase.execute(
      this.#buildSubmitClaimInput(req),
    );

    if (result.status === "VALIDATION_FAILED") {
      this.#renderValidationErrors(req, res, result.errorSummaries);
    } else if (result.status === "SUCCESS") {
      this.#handleSuccessfulSubmission(req, res, result.data);
    } else {
      this.#handleSubmissionFailure(result, res);
    }
  }

  #renderValidationErrors(
    req: Request,
    res: Response,
    errorSummaries: SubmitClaimErrorSummaries,
  ): void {
    res.render("claim/check-your-answers", {
      csrfToken: res.locals.csrfToken,
      ...this.#buildRenderData(req),
      errorSummaries,
    });
  }

  #handleSuccessfulSubmission(
    req: Request,
    res: Response,
    data: { claimId: number; rejectionReasons?: string[] } | undefined,
  ): void {
    const { session } = req;
    session.claimReferenceNumber = data?.claimId.toString() ?? "";
    session.claimRejectionReasons = data?.rejectionReasons;
    const hasRejectionReasons =
      (data?.rejectionReasons?.length ?? EMPTY_ARR_LENGTH) > EMPTY_ARR_LENGTH;

    if (hasRejectionReasons) {
      res.redirect("/claim/confirmation/reject");
    } else {
      res.redirect("/claim/confirmation/success");
    }
  }

  #handleSubmissionFailure(
    result: { status: string; reason?: string },
    res: Response,
  ): void {
    const reason = "reason" in result ? result.reason : "INVALID_INPUT_STATE";
    this.logger(
      JSON.stringify({
        event: "submit.claim.error",
        reason,
      }),
    );
    res.redirect("/error");
  }

  #buildSubmitClaimInput(req: Request): SubmitClaimInput {
    const { session } = req;
    const { claim = {}, providerEmail = "", accessToken } = session;
    const {
      caseReference = "",
      type = "",
      subtype = null,
      zeroVatTotal,
      netTotal,
      grossTotal,
      evidenceFiles,
      finalBillCostTemplate,
      inquestOutcomes,
      counselBillsPaid,
      fundingPostInquest,
      recoveryCostMade,
      recoveryCosts,
      recoveryDamages,
      recoveryInterest,
      recoveryPreCertificateCosts,
      preCertificateCosts,
      payingParty,
      counselNumber,
    } = claim;

    const isFinalBill = type === CLAIM_TYPE_VALUE.FINAL_BILL;
    const hasRecoveryCostsAwarded = this.#mapHasRecoveryCostsAwarded(recoveryCostMade);

    return {
      laaReference: caseReference,
      claimType: type,
      poaTypeId: subtype,
      claimantId: providerEmail,
      accessToken,
      zeroVatTotal: this.#parseAmount(zeroVatTotal),
      netTotal: this.#parseAmount(netTotal),
      grossTotal: this.#parseAmount(grossTotal),
      claimEvidenceIds: (evidenceFiles ?? []).map((file) => file.id),
      inquestOutcomes,
      claimCostTemplateFile:
        finalBillCostTemplate === undefined
          ? null
          : {
              claimCostTemplateFileId: finalBillCostTemplate.costTemplateId,
              claimCostTemplateFileName:
                finalBillCostTemplate.costTemplateFilename,
            },
      hasCounselBeenPaid: this.#mapHasCounselBeenPaid(counselNumber, counselBillsPaid),
      hasAlternativeFunding: this.#mapHasAlternativeFunding(fundingPostInquest),
      hasRecoveryCostsAwarded,
      financialRecoveryPreviousPreCertificateCosts: this.#parseAmount(
        hasRecoveryCostsAwarded === true
          ? recoveryPreCertificateCosts
          : preCertificateCosts,
      ),
      financialRecoveryCost:
        hasRecoveryCostsAwarded === true ? this.#parseAmount(recoveryCosts) : 0,
      financialRecoveryDamages:
        hasRecoveryCostsAwarded === true
          ? this.#parseAmount(recoveryDamages)
          : 0,
      financialRecoveryInterest:
        hasRecoveryCostsAwarded === true
          ? this.#parseAmount(recoveryInterest)
          : 0,
      payingParty: this.#normaliseText(payingParty),
      numberOfCounselInstructed: isFinalBill
        ? this.#mapCounselNumberForApi(counselNumber)
        : null,
    };
  }

  #parseAmount(value: string | undefined): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  #normaliseText(value: string | undefined): string | null {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  #mapCounselNumberForApi(counselNumber: string | undefined): string | null {
    if (typeof counselNumber !== "string") {
      return null;
    }

    if (counselNumber === "6_OR_MORE") {
      return "MORE_THAN_6";
    }

    return counselNumber;
  }

  #mapHasCounselBeenPaid(
    counselNumber: string | undefined,
    counselBillsPaid: boolean | undefined,
  ): boolean | null {
    if (counselNumber === COUNSEL_NUMBER_ZERO) {
      return false;
    }
    if (typeof counselBillsPaid === "boolean") {
      return counselBillsPaid;
    }
    return null;
  }

  #mapHasAlternativeFunding(
    fundingPostInquest: string | undefined,
  ): boolean | null {
    if (fundingPostInquest === FUNDING_POST_INQUEST_VALUE.YES) {
      return true;
    }
    if (
      fundingPostInquest === FUNDING_POST_INQUEST_VALUE.NO ||
      fundingPostInquest === FUNDING_POST_INQUEST_VALUE.DONT_KNOW
    ) {
      return false;
    }
    return null;
  }

  #mapHasRecoveryCostsAwarded(
    recoveryCostMade: string | undefined,
  ): boolean | null {
    if (recoveryCostMade === RECOVERY_COST_VALUE.YES) {
      return true;
    }
    if (
      recoveryCostMade === RECOVERY_COST_VALUE.NO ||
      recoveryCostMade === RECOVERY_COST_VALUE.DONT_KNOW
    ) {
      return false;
    }
    return null;
  }

  #buildRenderData(req: Request): Record<string, unknown> {
    const {
      session: { claim },
    } = req;
    return {
      caseDetails: this.#buildCaseDetails(claim),
      claimDetails: {
        claimType: this.#labelFor(CLAIM_TYPE_LABEL, claim?.type),
        claimSubtype: this.#labelFor(CLAIM_SUBTYPE_LABEL, claim?.subtype),
      },
      cost: this.#buildCostDetails(claim),
      evidence: {
        uploadedFiles: (claim?.evidenceFiles ?? []).map((file) => ({
          id: file.id,
          name: file.fileName,
          type: this.#fileType(file.fileName),
          fileSize: this.formatter.formatFileSize(file.fileSize),
        })),
      },
      counsel: this.#buildCounselDetails(claim),
      costTemplateFile: this.#buildCostTemplateFile(claim),
      inquestDetails: this.#buildInquestDetails(claim),
    };
  }

  #buildCostTemplateFile(
    claim?: ClaimSession,
  ): { id: string; name: string; type: string; fileSize: string } | undefined {
    const template = claim?.finalBillCostTemplate;
    if (template === undefined) {
      return undefined;
    }

    return {
      id: template.costTemplateId,
      name: template.costTemplateFilename,
      type: this.#fileType(template.costTemplateFilename),
      fileSize: this.formatter.formatFileSize(template.costTemplateFileSize),
    };
  }

  #buildCounselDetails(claim?: ClaimSession): {
    show: boolean;
    hasCounsel: boolean;
    counselNumber: string;
    counselPaid: string;
    endDate: string;
  } {
    const isFinalBill = claim?.type === CLAIM_TYPE_VALUE.FINAL_BILL;
    const counselNumber = claim?.counselNumber;
    const hasCounsel =
      isFinalBill &&
      typeof counselNumber === "string" &&
      counselNumber !== COUNSEL_NUMBER_ZERO;
    return {
      show: isFinalBill,
      hasCounsel,
      counselNumber: this.#counselNumberLabel(counselNumber),
      counselPaid: claim?.counselBillsPaid === true ? "Yes" : "No",
      endDate: this.#formatEndDate(
        claim?.endDateDay,
        claim?.endDateMonth,
        claim?.endDateYear,
      ),
    };
  }

  #counselNumberLabel(value?: string): string {
    return (
      COUNSEL_NUMBER_OPTIONS.find((option) => option.value === value)?.text ??
      ""
    );
  }

  #buildInquestDetails(claim?: ClaimSession): {
    inquestOutcomes: string;
    funding: string;
    recoveryCostMade: string;
    recoveryCosts: string;
    recoveryDamages: string;
    recoveryInterest: string;
    recoveryPreCertificateCosts: string;
    preCertificateCosts: string;
    showPreCertificateCosts: boolean;
    showFinancialRecoveryCosts: boolean;
    payingParty: string;
    showRecovery: boolean;
  } {
    const fundingPostInquest = claim?.fundingPostInquest;
    return {
      inquestOutcomes: this.#buildInquestOutcomeLabels(claim),
      funding: this.#optionLabel(
        FUNDING_POST_INQUEST_OPTIONS,
        fundingPostInquest,
      ),
      recoveryCostMade: this.#optionLabel(
        RECOVERY_COST_OPTIONS,
        claim?.recoveryCostMade,
      ),
      recoveryCosts: this.formatter.formatCurrency(claim?.recoveryCosts),
      recoveryDamages: this.formatter.formatCurrency(claim?.recoveryDamages),
      recoveryInterest: this.formatter.formatCurrency(claim?.recoveryInterest),
      recoveryPreCertificateCosts: this.formatter.formatCurrency(
        claim?.recoveryPreCertificateCosts,
      ),
      preCertificateCosts: this.formatter.formatCurrency(
        claim?.preCertificateCosts,
      ),
      showPreCertificateCosts: this.#hasPreCertificateCosts(claim),
      showFinancialRecoveryCosts: this.#recoveryCostWasMade(claim),
      payingParty: claim?.payingParty ?? "",
      showRecovery: this.#showRecovery(fundingPostInquest),
    };
  }

  #hasPreCertificateCosts(claim?: ClaimSession): boolean {
    const value = claim?.preCertificateCosts;
    return typeof value === "string" && value !== "";
  }

  #recoveryCostWasMade(claim?: ClaimSession): boolean {
    return claim?.recoveryCostMade === RECOVERY_COST_VALUE.YES;
  }

  #buildInquestOutcomeLabels(claim?: ClaimSession): string {
    const outcomes = claim?.inquestOutcomes ?? [];
    return outcomes
      .map(
        (value) =>
          INQUEST_OUTCOME_OPTIONS.find((o) => o.value === value)?.text ?? value,
      )
      .join(", ");
  }

  #showRecovery(fundingPostInquest?: string): boolean {
    return (
      fundingPostInquest === FUNDING_POST_INQUEST_VALUE.YES ||
      fundingPostInquest === FUNDING_POST_INQUEST_VALUE.DONT_KNOW
    );
  }

  #optionLabel(
    options: ReadonlyArray<{ value: string; text: string }>,
    value?: string,
  ): string {
    if (typeof value !== "string") {
      return "";
    }
    return options.find((option) => option.value === value)?.text ?? value;
  }

  #formatEndDate(day?: string, month?: string, year?: string): string {
    if (
      typeof day !== "string" ||
      typeof month !== "string" ||
      typeof year !== "string"
    ) {
      return "";
    }
    return `${day}/${month}/${year}`;
  }

  #fileType(fileName: string): string {
    const [fileType] = /(?<=\.)[^.]+$/v.exec(fileName) ?? [];
    return typeof fileType === "string" ? fileType.toUpperCase() : "";
  }

  renderConfirmSuccess(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      session: { claimReferenceNumber },
    } = req;

    res.render("claim/confirm-success", {
      csrfToken,
      claimReferenceNumber,
    });
  }

  renderConfirmReject(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const rejectionReasonDescriptions = (
      req.session.claimRejectionReasons ?? []
    ).map((reason) =>
      reason in CLAIM_REJECTION_REASON_LABEL
        ? CLAIM_REJECTION_REASON_LABEL[
            reason as keyof typeof CLAIM_REJECTION_REASON_LABEL
          ]
        : reason,
    );

    res.render("claim/confirm-reject", {
      csrfToken,
      rejectionReasonDescriptions,
    });
  }

  #buildCaseDetails(claim?: ClaimSession): {
    caseReference: string;
    clientFirstName: string;
    clientLastName: string;
    clientDateOfBirth: string;
  } {
    const client = claim?.client;
    return {
      caseReference: claim?.caseReference ?? "",
      clientFirstName: client?.clientFirstName ?? "",
      clientLastName: client?.clientLastName ?? "",
      clientDateOfBirth: client?.dateOfBirth ?? "",
    };
  }

  #labelFor(labels: Record<string, string>, value?: string): string {
    if (typeof value !== "string") {
      return "";
    }
    return labels[value] ?? value;
  }

  #buildCostDetails(claim?: ClaimSession): {
    zeroVatTotal: string;
    netTotal: string;
    grossTotal: string;
    changeHref: string;
  } {
    return {
      zeroVatTotal: this.#formatMoneyOrNone(claim?.zeroVatTotal),
      netTotal: this.#formatMoneyOrNone(claim?.netTotal),
      grossTotal: this.#formatMoneyOrNone(claim?.grossTotal),
      changeHref: "/claim/total-cost?from=check-your-answers",
    };
  }

  #formatMoneyOrNone(inputValue: string | undefined): string {
    const formattedCurrency = this.formatter.formatCurrency(inputValue);

    if (formattedCurrency === "") {
      return "None";
    } else {
      return formattedCurrency;
    }
  }
}
