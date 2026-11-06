import type { NextFunction, Request, Response } from "express";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
} from "#src/infrastructure/config/journeySequences.js";
import { JOURNEY_NOT_STARTED } from "#src/adaptors/presenters/utils/journeyStepHelper.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { CHECK_YOUR_ANSWERS_ORIGIN } from "#src/infrastructure/locales/constants.js";
import { CLAIM_PATHS } from "#src/infrastructure/express/routes/paths.js";

const STEP_NOT_IN_SEQUENCE = -1;
const FIRST_STEP_INDEX = 0;
const NEXT_STEP_OFFSET = 1;

interface JourneyGuardOptions {
  journeyType: "apply" | "claim";
  journeyPrefix: string;
  journeySequence: readonly string[];
  stepAliases?: Readonly<Record<string, string>>;
}

/**
 * Extract and validate the lastCompletedStepIndex from session state.
 * Returns JOURNEY_NOT_STARTED if the value is missing or out of bounds.
 */
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

  // If the index is out of bounds, treat as JOURNEY_NOT_STARTED
  if (
    rawLastCompleted >= JOURNEY_NOT_STARTED &&
    rawLastCompleted < sequenceLength
  ) {
    return rawLastCompleted;
  }

  return JOURNEY_NOT_STARTED;
}

function getJourneyStepIndex(
  options: JourneyGuardOptions,
  currentPath: string,
): number {
  const { journeyType, journeyPrefix, journeySequence } = options;
  const relativePath = currentPath.startsWith(journeyPrefix)
    ? currentPath.slice(journeyPrefix.length)
    : currentPath;
  const currentStepUrl =
    relativePath === "/" ? journeyPrefix : `${journeyPrefix}${relativePath}`;
  const canonicalStepUrl =
    options.stepAliases?.[currentStepUrl] ?? currentStepUrl;
  const currentIndex = journeySequence.indexOf(canonicalStepUrl);

  if (currentIndex === STEP_NOT_IN_SEQUENCE && journeyType === "claim") {
    return journeySequence.findIndex(
      (stepUrl) =>
        stepUrl !== journeyPrefix && canonicalStepUrl.startsWith(`${stepUrl}/`),
    );
  }
  return currentIndex;
}

function hasAllowedSummaryOrigin(
  req: Pick<Request, "query">,
  options: JourneyGuardOptions,
  lastCompletedStepIndex: number,
): boolean {
  if (
    options.journeyType !== "claim" ||
    req.query.from !== CHECK_YOUR_ANSWERS_ORIGIN
  ) {
    return true;
  }

  const summaryIndex = options.journeySequence.indexOf(
    CLAIM_PATHS.CHECK_YOUR_ANSWERS,
  );
  return lastCompletedStepIndex >= summaryIndex - NEXT_STEP_OFFSET;
}

/**
 * Middleware factory that creates a journey guard for a specific journey.
 *
 * The journey guard ensures users progress through steps sequentially:
 * - Allows access to the first step (index 0)
 * - Allows access to any step up to and including the last completed step + 1
 * - Redirects to the last completed step if attempting to skip ahead
 * - Allows access to steps not in the journey sequence (they bypass the guard)
 *
 * @param options Configuration for the journey guard
 * @returns Express middleware function
 */
export function createJourneyGuard(options: JourneyGuardOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { journeyType, journeySequence } = options;
    const { path: currentPath } = req;
    const currentIndex = getJourneyStepIndex(options, currentPath);

    // Path not in sequence - allow it (it might be a utility endpoint)
    if (currentIndex === STEP_NOT_IN_SEQUENCE) {
      next();
      return;
    }

    // Get the last completed step from session
    const sessionRecord = req.session as Record<string, unknown>;
    const { [journeyType]: journeyState } = sessionRecord;
    const lastCompletedStepIndex: number = getValidatedLastCompletedStep(
      journeyState,
      journeySequence.length,
    );

    // Allow access to first step (index 0) or any step up to lastCompleted + 1
    const isAllowedStep =
      (currentIndex === FIRST_STEP_INDEX ||
        currentIndex <= lastCompletedStepIndex + NEXT_STEP_OFFSET) &&
      hasAllowedSummaryOrigin(req, options, lastCompletedStepIndex);

    if (isAllowedStep) {
      next();
      return;
    }

    // User is trying to skip ahead - redirect to last completed step
    const redirectToIndex =
      lastCompletedStepIndex >= FIRST_STEP_INDEX &&
      lastCompletedStepIndex < journeySequence.length
        ? lastCompletedStepIndex
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

/**
 * Pre-configured journey guard middleware for the apply journey.
 *
 * Usage: app.use("/apply", applyJourneyGuard);
 */
export const applyJourneyGuard = createJourneyGuard({
  journeyType: "apply",
  journeyPrefix: "/apply",
  journeySequence: APPLY_JOURNEY_SEQUENCE,
});

export const claimJourneyGuard = createJourneyGuard({
  journeyType: "claim",
  journeyPrefix: "/claim",
  journeySequence: CLAIM_JOURNEY_SEQUENCE,
  stepAliases: {
    "/claim/confirmation/reject": "/claim/confirmation/success",
  },
});
