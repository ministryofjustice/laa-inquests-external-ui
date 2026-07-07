import type { z } from "zod";
import type {
  SubmitClaimRequestSchema,
  SubmitClaimResponseSchema,
} from "./SubmitClaim.schema.js";

export type SubmitClaimRequest = z.infer<typeof SubmitClaimRequestSchema>;
export type SubmitClaimResponse = z.infer<typeof SubmitClaimResponseSchema>;
