import type { ListClaimsPort } from "#src/ports/source/inquests-api/ListClaims.port.js";
import type { ClaimSummary } from "#src/adaptors/source/inquests-api/claim/ListClaims/models/ListClaims.types.js";
import type {
  ClaimClientDetails,
  ClaimSearchResult,
} from "#src/infrastructure/express/session/index.types.js";
import {
  BLOCKING_CLAIM_STATUSES,
  BLOCKING_CLAIM_TYPES,
} from "#src/infrastructure/locales/constants.js";

export type SelectCaseResult =
  | { status: "NOT_FOUND" }
  | { status: "ALLOWED"; client: ClaimClientDetails; officeId: string }
  | { status: "BLOCKED"; client: ClaimClientDetails; officeId: string };

export class SelectCaseUseCase {
  constructor(private readonly listClaimsPort: ListClaimsPort) {}

  async execute(
    laaReference: string,
    searchResults: ClaimSearchResult[],
    accessToken: string | undefined,
  ): Promise<SelectCaseResult> {
    const selected = searchResults.find(
      (result) => result.reference === laaReference,
    );

    if (selected === undefined) {
      return { status: "NOT_FOUND" };
    } else {
      const { officeId, ...client } = selected;
      const isBlocked = await this.#isClaimBlocked(laaReference, accessToken);
      return isBlocked
        ? { status: "BLOCKED", client, officeId }
        : { status: "ALLOWED", client, officeId };
    }
  }

  async #isClaimBlocked(
    laaReference: string,
    accessToken: string | undefined,
  ): Promise<boolean> {
    const [unassessed, assessed] = await Promise.all([
      this.listClaimsPort.listClaims(laaReference, false, accessToken),
      this.listClaimsPort.listClaims(laaReference, true, accessToken),
    ]);

    return [...unassessed, ...assessed].some((claim) =>
      this.#isBlockingClaim(claim),
    );
  }

  #isBlockingClaim(claim: ClaimSummary): boolean {
    const isBlockingType = BLOCKING_CLAIM_TYPES.some(
      (type) => type === claim.claimTypeId,
    );
    const isBlockingStatus = BLOCKING_CLAIM_STATUSES.some(
      (status) => status === claim.statusId,
    );
    return isBlockingType && isBlockingStatus;
  }
}
