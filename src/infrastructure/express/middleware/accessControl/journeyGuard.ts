import type { NextFunction, Request, Response } from "express";
import { APPLY_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";
import { JOURNEY_NOT_STARTED } from "#src/adaptors/presenters/utils/journeyStepHelper.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const STEP_NOT_IN_SEQUENCE = -1;
const FIRST_STEP_INDEX = 0;
const NEXT_STEP_OFFSET = 1;

interface JourneyGuardOptions {
  journeyType: "apply" | "claim";
  journeyPrefix: string;
  journeySequence: readonly string[];
}

function getValidatedLastCompletedStep(
  journeyState: unknown,
  sequenceLength: number,
): number {
  const rawLastCompleted =
    journeyState instanceof Object &&
    "lastCompletedStepIndex" in journeyState &&
    typeof journeyState.lastCompletedStepIndex === "number"
      ? journeyState.lastCompletedStepIndex
      : JOURNEY_NOT_STARTED;

  if (
    rawLastCompleted >= JOURNEY_NOT_STARTED &&
    rawLastCompleted < sequenceLength
  ) {
    return rawLastCompleted;
  }

  return JOURNEY_NOT_STARTED;
}

export function createJourneyGuard(options: JourneyGuardOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { journeyType, journeyPrefix, journeySequence } = options;
    const { path: currentPath } = req;

    const relativePath = currentPath.startsWith(journeyPrefix)
      ? currentPath.slice(journeyPrefix.length)
      : currentPath;

    const currentStepUrl = `${journeyPrefix}${relativePath}`;
    const currentIndex = journeySequence.indexOf(currentStepUrl);

    if (currentIndex === STEP_NOT_IN_SEQUENCE) {
      next();
      return;
    }

    const sessionRecord = req.session as Record<string, unknown>;
    const { [journeyType]: journeyState } = sessionRecord;
    const lastCompletedStepIndex: number = getValidatedLastCompletedStep(
      journeyState,
      journeySequence.length,
    );

    const isAllowedStep =
      currentIndex === FIRST_STEP_INDEX ||
      currentIndex <= lastCompletedStepIndex + NEXT_STEP_OFFSET;

    if (isAllowedStep) {
      next();
      return;
    }

    const redirectToIndex =
      lastCompletedStepIndex >= FIRST_STEP_INDEX &&
      lastCompletedStepIndex < journeySequence.length - NEXT_STEP_OFFSET
        ? lastCompletedStepIndex + NEXT_STEP_OFFSET
        : FIRST_STEP_INDEX;

    // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- array access by computed index
    const lastCompletedUrl = journeySequence[redirectToIndex];

    logger.logInfo({
      functionName: "journey_guard",
      message: "User attempted to skip ahead in journey",
      request: req,
      extraContext: {
        event: "journey_skip_prevented",
        journey_type: journeyType,
        current_path: currentPath,
        current_index: currentIndex,
        last_completed_index: lastCompletedStepIndex,
        redirect_to: lastCompletedUrl,
      },
    });

    res.redirect(lastCompletedUrl);
  };
}

export const applyJourneyGuard = createJourneyGuard({
  journeyType: "apply",
  journeyPrefix: "/apply",
  journeySequence: APPLY_JOURNEY_SEQUENCE,
});
