import type { Request } from "express";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
} from "#src/infrastructure/config/journeySequences.js";

const STEP_NOT_FOUND = -1;
const PREVIOUS_STEP_OFFSET = 1;

/** Constant representing the initial journey state (no steps completed yet) */
export const JOURNEY_NOT_STARTED = -1;

/**
 * Marks a journey step as complete in the session.
 * Called after successful form validation to record progress.
 *
 * The journey guard middleware uses this to allow or deny access to subsequent steps.
 * Adaptors must call this with the current page URL before redirecting.
 *
 * If the URL is not in the journey sequence, this silently does nothing.
 *
 * @param req Express request with session
 * @param currentUrl The current page URL (e.g. "/apply/office-accounts")
 */
export function markStepComplete(
  req: Pick<Request, "session">,
  currentUrl: string,
  options: {
    journeyType: "apply" | "claim";
    journeySequence: readonly string[];
  } = {
    journeyType: "apply",
    journeySequence: APPLY_JOURNEY_SEQUENCE,
  },
): void {
  const { journeyType, journeySequence } = options;
  const stepIndex = journeySequence.indexOf(currentUrl);

  if (stepIndex === STEP_NOT_FOUND) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive check for test scenarios
  if (req.session === null || req.session === undefined) {
    return;
  }

  const sessionRecord = req.session as Record<string, unknown>;
  const { [journeyType]: currentJourney } = sessionRecord;
  const mergedState =
    typeof currentJourney === "object" && currentJourney !== null
      ? (currentJourney as Record<string, unknown>)
      : {};

  sessionRecord[journeyType] = {
    ...mergedState,
    lastCompletedStepIndex: stepIndex,
  };
}

export function markClaimStepComplete(
  req: Pick<Request, "session">,
  currentUrl: string,
  nextUrl?: string,
): void {
  const currentIndex = CLAIM_JOURNEY_SEQUENCE.indexOf(currentUrl);
  if (currentIndex === STEP_NOT_FOUND) {
    return;
  }

  const nextIndex = CLAIM_JOURNEY_SEQUENCE.indexOf(nextUrl ?? "");
  const completedIndex = Math.max(
    currentIndex,
    nextIndex - PREVIOUS_STEP_OFFSET,
  );
  const { [completedIndex]: completedUrl } = CLAIM_JOURNEY_SEQUENCE;

  markStepComplete(req, completedUrl, {
    journeyType: "claim",
    journeySequence: CLAIM_JOURNEY_SEQUENCE,
  });
}
