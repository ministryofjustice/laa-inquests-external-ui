import type { ListClaimsPort } from "#src/ports/source/inquests-api/ListClaims.port.js";
import type { ClaimSummary } from "#src/adaptors/source/inquests-api/claim/ListClaims/models/ListClaims.types.js";
import type { ClaimClientDetails } from "#src/infrastructure/express/session/index.types.js";
import {
  BLOCKING_CLAIM_STATUSES,
  BLOCKING_CLAIM_TYPES,
} from "#src/infrastructure/locales/constants.js";

export type SelectCaseResult =
  | { status: "NOT_FOUND" }
  | { status: "ALLOWED"; client: ClaimClientDetails }
  | { status: "BLOCKED"; client: ClaimClientDetails };

export class SelectCaseUseCase {
  constructor(private readonly listClaimsPort: ListClaimsPort) {}

  async execute(
    laaReference: string,
    searchResults: ClaimClientDetails[],
    accessToken: string | undefined,
  ): Promise<SelectCaseResult> {
    const client = searchResults.find(
      (result) => result.reference === laaReference,
    );

    if (client === undefined) {
      return { status: "NOT_FOUND" };
    } else {
      const isBlocked = await this.#isClaimBlocked(laaReference, accessToken);
      return isBlocked
        ? { status: "BLOCKED", client }
        : { status: "ALLOWED", client };
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
