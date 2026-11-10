import type { Request } from "express";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
} from "#src/infrastructure/config/journeySequences.js";

const STEP_NOT_FOUND = -1;

export const JOURNEY_NOT_STARTED = -1;

export type JourneyType = "apply" | "claim";

export function markStepComplete(
  req: Pick<Request, "session">,
  currentUrl: string,
  journeyType: JourneyType = "apply",
  completedThroughUrl: string = currentUrl,
): void {
  const journeySequence =
    journeyType === "apply" ? APPLY_JOURNEY_SEQUENCE : CLAIM_JOURNEY_SEQUENCE;
  const stepIndex = (journeySequence as readonly string[]).indexOf(currentUrl);
  const completedThroughIndex = (journeySequence as readonly string[]).indexOf(
    completedThroughUrl,
  );

  if (
    stepIndex === STEP_NOT_FOUND ||
    completedThroughIndex === STEP_NOT_FOUND
  ) {
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
    lastCompletedStepIndex: Math.max(stepIndex, completedThroughIndex),
  };
}
