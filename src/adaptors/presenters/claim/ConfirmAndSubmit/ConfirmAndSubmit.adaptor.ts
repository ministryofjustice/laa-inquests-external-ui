import type { Request, Response } from "express";
import type { ClaimSession } from "#src/infrastructure/express/session/index.types.js";
import {
  CLAIM_SUBTYPE_LABEL,
  CLAIM_TYPE_LABEL,
  CONFIRM_CLAIM_PLACEHOLDER,
} from "#src/infrastructure/locales/constants.js";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import {
  SubmitClaimUseCase,
  type SubmitClaimInput,
} from "#src/use-cases/claim/SubmitClaim.useCase.js";
import { appInfo } from "#src/infrastructure/express/middleware/logger.js";

interface ConfirmAndSubmitUseCases {
  submitClaim: SubmitClaimUseCase;
}

const TWO_DECIMAL_PLACES = 2;

const GBP_CURRENCY_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: TWO_DECIMAL_PLACES,
  maximumFractionDigits: TWO_DECIMAL_PLACES,
});

export class ConfirmAndSubmitAdaptor {
  submitClaimUseCase: SubmitClaimUseCase;
  logger: (message: string) => void;

  constructor(
    claimSubmitPort: ClaimSubmitPort,
    useCases?: Partial<ConfirmAndSubmitUseCases>,
    logger: (message: string) => void = appInfo,
  ) {
    this.submitClaimUseCase =
      useCases?.submitClaim ?? new SubmitClaimUseCase(claimSubmitPort);
    this.logger = logger;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      session: { claim },
    } = req;

    res.render("claim/check-your-answers", {
      csrfToken,
      caseDetails: this.#buildCaseDetails(claim),
      claimDetails: {
        claimType: this.#labelFor(CLAIM_TYPE_LABEL, claim?.type),
        claimSubtype: this.#labelFor(CLAIM_SUBTYPE_LABEL, claim?.subtype),
      },
      cost: this.#buildCostDetails(claim),
      evidence: {
        uploadedFiles: CONFIRM_CLAIM_PLACEHOLDER.UPLOADED_FILES,
      },
    });
  }

  async processForm(req: Request, res: Response): Promise<void> {
    const result = await this.submitClaimUseCase.execute(
      this.#buildSubmitClaimInput(req),
    );

    if (result.status !== "SUCCESS") {
      const reason = "reason" in result ? result.reason : "INVALID_INPUT_STATE";
      this.logger(
        JSON.stringify({
          event: "submit.claim.error",
          reason,
        }),
      );
      res.redirect("/error");
      return;
    }

    const { session } = req;
    session.claimReferenceNumber = result.data?.claimId.toString() ?? "";
    res.redirect("/claim/confirmation/success");
  }

  #buildSubmitClaimInput(req: Request): SubmitClaimInput {
    const { session } = req;
    const { claim, providerEmail, accessToken } = session;
    return {
      laaReference: claim?.caseReference ?? "",
      claimType: claim?.type ?? "",
      poaTypeId: claim?.subtype ?? "",
      claimantId: providerEmail ?? "",
      accessToken,
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
      netTotal: this.#formatMoney(
        claim?.netTotal,
        CONFIRM_CLAIM_PLACEHOLDER.NET_TOTAL,
      ),
      grossTotal: this.#formatMoney(
        claim?.grossTotal,
        CONFIRM_CLAIM_PLACEHOLDER.GROSS_TOTAL,
      ),
    };
  }

  #formatMoney(inputValue: string | undefined, fallback: string): string {
    if (typeof inputValue !== "string") {
      return fallback;
    }

    const parsedValue = Number(inputValue);

    if (!Number.isFinite(parsedValue)) {
      return fallback;
    }

    return GBP_CURRENCY_FORMATTER.format(parsedValue);
  }
}
