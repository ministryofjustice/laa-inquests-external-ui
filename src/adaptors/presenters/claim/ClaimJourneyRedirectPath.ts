import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";

export const CLAIM_JOURNEY_REDIRECT_PATH_BY_STATE: Partial<
  Record<ClaimJourneyState, string>
> = {
  [ClaimJourneyState.CASE_SELECTION_INCOMPLETE]: "/claim",
  [ClaimJourneyState.CLAIM_TYPE_INCOMPLETE]: "/claim/type",
  [ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE]: "/claim/subtype",
  [ClaimJourneyState.TOTAL_COST_INCOMPLETE]: "/claim/total-cost",
  [ClaimJourneyState.EVIDENCE_INCOMPLETE]: "/claim/evidence",
};

export function getClaimJourneyRedirectPath(
  journeyState: ClaimJourneyState,
  allowedStates: ClaimJourneyState[] = [],
): string | null {
  if (allowedStates.includes(journeyState)) {
    return null;
  }

  return CLAIM_JOURNEY_REDIRECT_PATH_BY_STATE[journeyState] ?? null;
}
