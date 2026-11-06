import type { Request } from "express";
import { APPLY_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";

const STEP_NOT_FOUND = -1;

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
): void {
  const stepIndex = (APPLY_JOURNEY_SEQUENCE as readonly string[]).indexOf(
    currentUrl,
  );

  if (stepIndex === STEP_NOT_FOUND) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive check for test scenarios
  if (req.session === null || req.session === undefined) {
    return;
  }

  const sessionRecord = req.session as Record<string, unknown>;
  const { apply: currentApply } = sessionRecord;
  const mergedState =
    typeof currentApply === "object" && currentApply !== null
      ? (currentApply as Record<string, unknown>)
      : {};

  sessionRecord.apply = {
    ...mergedState,
    lastCompletedStepIndex: stepIndex,
  };
}
