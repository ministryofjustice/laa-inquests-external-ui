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
import { ClaimJourneyStateUseCase } from "#src/use-cases/claim/ClaimJourneyState.useCase.js";
import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";

interface ConfirmAndSubmitUseCases {
  submitClaim: SubmitClaimUseCase;
  claimJourneyState: ClaimJourneyStateUseCase;
}

export class ConfirmAndSubmitAdaptor {
  submitClaimUseCase: SubmitClaimUseCase;
  claimJourneyStateUseCase: ClaimJourneyStateUseCase;
  logger: (message: string) => void;

  static readonly JOURNEY_STATE_TO_REDIRECT_PATH: Partial<
    Record<ClaimJourneyState, string>
  > = {
    [ClaimJourneyState.CASE_SELECTION_INCOMPLETE]: "/claim",
    [ClaimJourneyState.CLAIM_TYPE_INCOMPLETE]: "/claim/type",
    [ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE]: "/claim/subtype",
    [ClaimJourneyState.TOTAL_COST_INCOMPLETE]: "/claim/total-cost",
    [ClaimJourneyState.EVIDENCE_INCOMPLETE]: "/claim/evidence",
  };

  constructor(
    claimSubmitPort: ClaimSubmitPort,
    useCases?: Partial<ConfirmAndSubmitUseCases>,
    logger: (message: string) => void = appInfo,
  ) {
    this.submitClaimUseCase =
      useCases?.submitClaim ?? new SubmitClaimUseCase(claimSubmitPort);
    this.claimJourneyStateUseCase =
      useCases?.claimJourneyState ?? new ClaimJourneyStateUseCase();
    this.logger = logger;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      session: { claim },
    } = req;

    const journeyState = this.claimJourneyStateUseCase.execute(claim);
    const incompleteJourneyRedirectPath =
      ConfirmAndSubmitAdaptor.JOURNEY_STATE_TO_REDIRECT_PATH[journeyState] ??
      null;

    if (incompleteJourneyRedirectPath !== null) {
      res.redirect(incompleteJourneyRedirectPath);
      return;
    }

    res.render("claim/check-your-answers", {
      csrfToken,
      caseDetails: this.#buildCaseDetails(claim),
      claimDetails: {
        claimType: this.#labelFor(CLAIM_TYPE_LABEL, claim?.type),
        claimSubtype: this.#labelFor(CLAIM_SUBTYPE_LABEL, claim?.subtype),
      },
      cost: {
        netTotal: CONFIRM_CLAIM_PLACEHOLDER.NET_TOTAL,
        grossTotal: CONFIRM_CLAIM_PLACEHOLDER.GROSS_TOTAL,
      },
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
}
