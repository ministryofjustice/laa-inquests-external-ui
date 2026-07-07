import type {
  SubmitClaimRequest,
  SubmitClaimResponse,
} from "#src/adaptors/source/inquests-api/claim/SubmitClaim/models/SubmitClaim.types.js";

export interface ClaimSubmitPort {
  submitClaim: (
    laaReference: string,
    body: SubmitClaimRequest,
    accessToken: string | undefined,
  ) => Promise<SubmitClaimResponse>;
}
