import type { Request, Response } from "express";
import { APPLY_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";

const ZERO = 0;
const OFFSET = 1;

export const JOURNEY_NOT_STARTED = -1;

export function completeStepAndRedirect(
  req: Request,
  res: Response,
  redirectToUrl: string,
): void {
  const stepIndex =
    (APPLY_JOURNEY_SEQUENCE as readonly string[]).indexOf(redirectToUrl) -
    OFFSET;

  const { [stepIndex]: pageToMark } = APPLY_JOURNEY_SEQUENCE;
  markStepComplete(req, pageToMark);
  res.redirect(redirectToUrl);
}

export function markStepComplete(
  req: Pick<Request, "session">,
  pageToMark: string,
): void {
  const stepIndex = (APPLY_JOURNEY_SEQUENCE as readonly string[]).indexOf(
    pageToMark,
  );

  if (stepIndex < ZERO) {
    throw new Error(`Invalid page to mark: ${pageToMark}`);
  }

  const sessionRecord = req.session as Record<string, unknown>;

  sessionRecord.apply = {
    lastCompletedStepIndex: stepIndex,
  };
}
