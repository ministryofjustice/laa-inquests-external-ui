import type { z } from "zod";
import type {
  ClaimSummarySchema,
  ListClaimsResponseSchema,
} from "./ListClaims.schema.js";

export type ClaimSummary = z.infer<typeof ClaimSummarySchema>;
export type ListClaimsResponse = z.infer<typeof ListClaimsResponseSchema>;
