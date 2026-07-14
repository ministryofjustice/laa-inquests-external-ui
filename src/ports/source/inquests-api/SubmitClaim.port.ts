import type {
  SubmitClaimRequest,
  SubmitClaimResponse,
} from "#src/adaptors/source/inquests-api/claim/SubmitClaim/models/SubmitClaim.types.js";

export type SubmitClaimPortResult =
  | { status: "CREATED"; data: SubmitClaimResponse }
  | { status: "UNPROCESSABLE"; errorCode: string };

export interface ClaimSubmitPort {
  submitClaim: (
    laaReference: string,
    body: SubmitClaimRequest,
    accessToken: string | undefined,
  ) => Promise<SubmitClaimPortResult>;
}
