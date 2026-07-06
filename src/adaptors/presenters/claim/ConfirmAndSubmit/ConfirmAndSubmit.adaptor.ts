import type { Request, Response } from "express";
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
      session: { claimSelectedReference, claimType, claimSubtype },
    } = req;

    res.render("claim/check-your-answers", {
      csrfToken,
      caseDetails: {
        caseReference: claimSelectedReference ?? "",
        clientFirstName: CONFIRM_CLAIM_PLACEHOLDER.CLIENT_FIRST_NAME,
        clientLastName: CONFIRM_CLAIM_PLACEHOLDER.CLIENT_LAST_NAME,
        clientDateOfBirth: CONFIRM_CLAIM_PLACEHOLDER.CLIENT_DATE_OF_BIRTH,
      },
      claimDetails: {
        claimType: this.#labelFor(CLAIM_TYPE_LABEL, claimType),
        claimSubtype: this.#labelFor(CLAIM_SUBTYPE_LABEL, claimSubtype),
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

  #labelFor(labels: Record<string, string>, value?: string): string {
    if (typeof value !== "string") {
      return "";
    }
    return labels[value] ?? value;
  }
}
