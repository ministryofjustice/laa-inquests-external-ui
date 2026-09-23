import type { ListClaimsPort } from "#src/ports/source/inquests-api/ListClaims.port.js";
import type { ClaimSummary } from "#src/adaptors/source/inquests-api/claim/ListClaims/models/ListClaims.types.js";
import {
  BLOCKING_CLAIM_STATUSES,
  BLOCKING_CLAIM_TYPES,
} from "#src/infrastructure/locales/constants.js";

export type ClaimBlockResult = { status: "ALLOWED" } | { status: "BLOCKED" };

export class CheckClaimBlockUseCase {
  constructor(private readonly listClaimsPort: ListClaimsPort) {}

  async execute(
    laaReference: string,
    accessToken: string | undefined,
  ): Promise<ClaimBlockResult> {
    const [unassessed, assessed] = await Promise.all([
      this.listClaimsPort.listClaims(laaReference, false, accessToken),
      this.listClaimsPort.listClaims(laaReference, true, accessToken),
    ]);

    const isBlocked = [...unassessed, ...assessed].some((claim) =>
      this.#isBlockingClaim(claim),
    );

    return isBlocked ? { status: "BLOCKED" } : { status: "ALLOWED" };
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
