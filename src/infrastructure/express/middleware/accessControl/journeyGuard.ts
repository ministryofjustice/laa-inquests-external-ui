import type { NextFunction, Request, Response } from "express";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
  JOURNEY_TYPES,
} from "#src/infrastructure/config/journeySequences.js";
import { JOURNEY_NOT_STARTED } from "#src/adaptors/presenters/utils/journeyStepHelper.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const STEP_NOT_IN_SEQUENCE = -1;
const FIRST_STEP_INDEX = 0;
const NEXT_STEP_OFFSET = 1;
const QUERY_STRING_SEPARATOR = "?";

interface JourneyGuardOptions {
  journeyType: JOURNEY_TYPES;
  journeyPrefix: string;
  journeySequence: readonly string[];
}

function getValidatedLastCompletedStep(
  session: unknown,
  sequenceLength: number,
): number {
  const rawLastCompleted =
    session instanceof Object &&
    "lastCompletedStepIndex" in session &&
    typeof session.lastCompletedStepIndex === "number"
      ? session.lastCompletedStepIndex
      : JOURNEY_NOT_STARTED;

  if (
    rawLastCompleted >= JOURNEY_NOT_STARTED &&
    rawLastCompleted < sequenceLength
  ) {
    return rawLastCompleted;
  }

  return JOURNEY_NOT_STARTED;
}

function getRedirectIndex(
  lastCompletedStepIndex: number,
  sequenceLength: number,
): number {
  return lastCompletedStepIndex >= FIRST_STEP_INDEX &&
    lastCompletedStepIndex < sequenceLength - NEXT_STEP_OFFSET
    ? lastCompletedStepIndex + NEXT_STEP_OFFSET
    : FIRST_STEP_INDEX;
}

export function createJourneyGuard(options: JourneyGuardOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { journeyType, journeyPrefix, journeySequence } = options;
    const { originalUrl: fullPath } = req;

    // Strip query parameters to get just the path
    const [currentPath] = fullPath.split(QUERY_STRING_SEPARATOR);

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
    const lastCompletedStepIndex: number = getValidatedLastCompletedStep(
      sessionRecord,
      journeySequence.length,
    );

    const isAllowedStep =
      currentIndex === FIRST_STEP_INDEX ||
      currentIndex <= lastCompletedStepIndex + NEXT_STEP_OFFSET;

    if (isAllowedStep) {
      next();
      return;
    }

    const redirectToIndex = getRedirectIndex(
      lastCompletedStepIndex,
      journeySequence.length,
    );

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
  journeyType: JOURNEY_TYPES.APPLY,
  journeyPrefix: "/apply",
  journeySequence: APPLY_JOURNEY_SEQUENCE,
});

export const claimJourneyGuard = createJourneyGuard({
  journeyType: JOURNEY_TYPES.CLAIM,
  journeyPrefix: "/claim",
  journeySequence: CLAIM_JOURNEY_SEQUENCE,
});
