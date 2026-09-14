import type { Request } from "express";
import { CHECK_YOUR_ANSWERS_ORIGIN } from "#src/infrastructure/locales/constants.js";
import { CLAIM_PATHS } from "#src/infrastructure/express/routes/paths.js";

export class ClaimNavigationHelper {
  captureCheckYourAnswersEntry(req: Request): void {
    if (this.#isCheckYourAnswersOrigin(req)) {
      req.session.claim = {
        ...req.session.claim,
        returnToCheckYourAnswers: true,
        recoveryCostMadeEditInProgress: undefined,
      };
    }
  }

  isReturningToCheckYourAnswers(req: Pick<Request, "session">): boolean {
    return req.session.claim?.returnToCheckYourAnswers === true;
  }

  resolveBackHref(req: Pick<Request, "session">, defaultHref: string): string {
    return this.isReturningToCheckYourAnswers(req)
      ? CLAIM_PATHS.CHECK_YOUR_ANSWERS
      : defaultHref;
  }

  resolveCostPageBackHref(
    req: Pick<Request, "session">,
    defaultHref: string,
  ): string {
    if (req.session.claim?.recoveryCostMadeEditInProgress === true) {
      return defaultHref;
    }
    return this.resolveBackHref(req, defaultHref);
  }

  markRecoveryCostMadeEdit(req: Pick<Request, "session">): void {
    req.session.claim = {
      ...req.session.claim,
      recoveryCostMadeEditInProgress: true,
    };
  }

  clearReturnToCheckYourAnswersFlag(req: Pick<Request, "session">): void {
    if (req.session.claim === undefined) {
      return;
    }
    req.session.claim = {
      ...req.session.claim,
      returnToCheckYourAnswers: undefined,
      recoveryCostMadeEditInProgress: undefined,
    };
  }

  #isCheckYourAnswersOrigin(req: Request): boolean {
    return req.query.from === CHECK_YOUR_ANSWERS_ORIGIN;
  }
}
