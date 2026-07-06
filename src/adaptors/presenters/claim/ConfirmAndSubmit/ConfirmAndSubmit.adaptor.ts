import type { Request, Response } from "express";
import type { ClaimSession } from "#src/infrastructure/express/session/index.types.js";
import {
  CLAIM_SUBTYPE_LABEL,
  CLAIM_TYPE_LABEL,
  CONFIRM_CLAIM_PLACEHOLDER,
} from "#src/infrastructure/locales/constants.js";

export class ConfirmAndSubmitAdaptor {
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
      cost: {
        netTotal: CONFIRM_CLAIM_PLACEHOLDER.NET_TOTAL,
        grossTotal: CONFIRM_CLAIM_PLACEHOLDER.GROSS_TOTAL,
      },
      evidence: {
        uploadedFiles: CONFIRM_CLAIM_PLACEHOLDER.UPLOADED_FILES,
      },
    });
  }

  processForm(req: Request, res: Response): void {
    res.redirect("/");
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
