import type { Request, Response } from "express";
import type { ClaimSession } from "#src/infrastructure/express/session/index.types.js";
import {
  EMPTY_ARR_LENGTH,
  CLAIM_REJECTION_REASON_LABEL,
  CLAIM_SUBTYPE_LABEL,
  CLAIM_TYPE_LABEL,
  CONFIRM_CLAIM_PLACEHOLDER,
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
      appLogger.logInfo("ConfirmAndSubmit", message);
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
      subtype = "",
      zeroVatTotal,
      netTotal,
      grossTotal,
    } = claim;
    return {
      laaReference: caseReference,
      claimType: type,
      poaTypeId: subtype,
      claimantId: providerEmail,
      accessToken,
      zeroVatTotal: this.#parseAmount(zeroVatTotal),
      netTotal: this.#parseAmount(netTotal),
      grossTotal: this.#parseAmount(grossTotal),
    };
  }

  #parseAmount(value: string | undefined): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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
        uploadedFiles: CONFIRM_CLAIM_PLACEHOLDER.UPLOADED_FILES,
      },
    };
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
    netTotal: string;
    grossTotal: string;
  } {
    return {
      netTotal: this.#formatMoney(claim?.netTotal),
      grossTotal: this.#formatMoney(claim?.grossTotal),
    };
  }

  #formatMoney(inputValue: string | undefined): string {
    return this.formatter.formatCurrency(inputValue);
  }
}
