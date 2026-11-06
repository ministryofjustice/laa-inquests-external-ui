import type { Request } from "express";
import { APPLY_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";

const STEP_NOT_FOUND = -1;

export const JOURNEY_NOT_STARTED = -1;

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
