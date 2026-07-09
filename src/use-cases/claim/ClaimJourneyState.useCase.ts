import type { ClaimSession } from "#src/infrastructure/express/session/index.types.js";
import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";

export class ClaimJourneyStateUseCase {
  execute(claim?: ClaimSession): ClaimJourneyState {
    if (this.#isCaseSelectionIncomplete(claim)) {
      return ClaimJourneyState.CASE_SELECTION_INCOMPLETE;
    }

    if (claim === undefined) {
      return ClaimJourneyState.CASE_SELECTION_INCOMPLETE;
    }

    if (this.#isClaimTypeIncomplete(claim)) {
      return ClaimJourneyState.CLAIM_TYPE_INCOMPLETE;
    }

    if (this.#isClaimSubtypeIncomplete(claim)) {
      return ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE;
    }

    if (this.#isTotalCostIncomplete(claim)) {
      return ClaimJourneyState.TOTAL_COST_INCOMPLETE;
    }

    if (this.#isEvidenceIncomplete(claim)) {
      return ClaimJourneyState.EVIDENCE_INCOMPLETE;
    }

    return ClaimJourneyState.COMPLETE;
  }

  #isCaseSelectionIncomplete(claim?: ClaimSession): boolean {
    return claim?.caseReference === undefined || claim.client === undefined;
  }

  #isClaimTypeIncomplete(claim: ClaimSession): boolean {
    return (
      claim.type === undefined ||
      claim.type === "" ||
      claim.typeCompleted !== true
    );
  }

  #isClaimSubtypeIncomplete(claim: ClaimSession): boolean {
    return (
      claim.type === "PAYMENT_ON_ACCOUNT" &&
      (claim.subtype === undefined ||
        claim.subtype === "" ||
        claim.subtypeCompleted !== true)
    );
  }

  #isTotalCostIncomplete(claim: ClaimSession): boolean {
    return claim.totalCostCompleted !== true;
  }

  #isEvidenceIncomplete(claim: ClaimSession): boolean {
    return claim.evidenceCompleted !== true;
  }
}
