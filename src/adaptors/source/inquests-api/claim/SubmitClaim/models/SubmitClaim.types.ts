import type { z } from "zod";
import type {
  SubmitClaimApiErrorSchema,
  SubmitClaimRequestSchema,
  SubmitClaimResponseSchema,
} from "./SubmitClaim.schema.js";

export type SubmitClaimApiError = z.infer<typeof SubmitClaimApiErrorSchema>;
export type SubmitClaimRequest = z.infer<typeof SubmitClaimRequestSchema>;
export type SubmitClaimResponse = z.infer<typeof SubmitClaimResponseSchema>;
