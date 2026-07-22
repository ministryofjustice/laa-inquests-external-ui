import type {
  SubmitClaimResponseAccepted,
  SubmitClaimRequest,
} from "#src/adaptors/source/inquests-api/claim/SubmitClaim/models/SubmitClaim.types.js";

export type SubmitClaimPortResult =
  | { status: "CREATED"; data: SubmitClaimResponseAccepted }
  | {
      status: "REJECTED";
      data: { claimId: number; rejectionReasons: string[] };
    }
  | { status: "UNPROCESSABLE"; errorCode: string };

export interface ClaimSubmitPort {
  submitClaim: (
    laaReference: string,
    body: SubmitClaimRequest,
    accessToken: string | undefined,
  ) => Promise<SubmitClaimPortResult>;
}
