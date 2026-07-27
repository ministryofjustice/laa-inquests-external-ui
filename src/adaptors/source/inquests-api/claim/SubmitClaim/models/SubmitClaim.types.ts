import type { z } from "zod";
import type {
  ClaimRejectionReasonCodeSchema,
  SubmitClaimApiErrorSchema,
  SubmitClaimRequestSchema,
  SubmitClaimResponseAcceptedSchema,
  SubmitClaimResponseRejectedSchema,
  SubmitClaimResponseSchema,
} from "./SubmitClaim.schema.js";

export type SubmitClaimApiError = z.infer<typeof SubmitClaimApiErrorSchema>;
export type SubmitClaimRequest = z.infer<typeof SubmitClaimRequestSchema>;
export type ClaimRejectionReasonCode = z.infer<
  typeof ClaimRejectionReasonCodeSchema
>;
export type SubmitClaimResponseAccepted = z.infer<
  typeof SubmitClaimResponseAcceptedSchema
>;
export type SubmitClaimResponseRejected = z.infer<
  typeof SubmitClaimResponseRejectedSchema
>;
export type SubmitClaimResponse = z.infer<typeof SubmitClaimResponseSchema>;
