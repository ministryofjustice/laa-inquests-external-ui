import type { Request, Response } from "express";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
} from "#src/infrastructure/config/journeySequences.js";

const ZERO = 0;
const OFFSET = 1;

export const JOURNEY_NOT_STARTED = -1;

export function completeStepAndRedirect(
  req: Request,
  res: Response,
  redirectToUrl: string,
): void {
  const noQueryUrl = redirectToUrl.split("?").at(ZERO)!;

  const journey =
    redirectToUrl.split("/").at(OFFSET) === "apply"
      ? APPLY_JOURNEY_SEQUENCE
      : CLAIM_JOURNEY_SEQUENCE;

  const stepIndex =
    journey.indexOf(noQueryUrl) === ZERO
      ? ZERO
      : journey.indexOf(noQueryUrl) - OFFSET;

  markStepComplete(req, journey[stepIndex]);
  res.redirect(redirectToUrl);
}

export function markStepComplete(
  req: Pick<Request, "session">,
  pageToMark: string,
): void {
  const journeyType = pageToMark.split("/").at(OFFSET);

  const sessionRecord = req.session as Record<string, unknown>;

  if (journeyType === "apply") {
    const stepIndex = (APPLY_JOURNEY_SEQUENCE as readonly string[]).indexOf(
      pageToMark,
    );

    if (stepIndex < ZERO) {
      throw new Error(`Invalid page to mark: ${pageToMark}`);
    }

    sessionRecord.apply = {
      lastCompletedStepIndex: stepIndex,
    };
  } else if (journeyType === "claim") {
    const stepIndex = (CLAIM_JOURNEY_SEQUENCE as readonly string[]).indexOf(
      pageToMark,
    );

    if (stepIndex < ZERO) {
      throw new Error(`Invalid page to mark: ${pageToMark}`);
    }

    const existingClaimData = sessionRecord.claim ?? {};
    sessionRecord.claim = {
      ...existingClaimData,
      lastCompletedStepIndex: stepIndex,
    };
  } else {
    throw new Error(`Unsupported pageToMark: ${pageToMark}`);
  }
}
