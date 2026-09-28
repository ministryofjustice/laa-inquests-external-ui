import { z } from "zod";

export const ClaimSummarySchema = z.object({
  claimTypeId: z.string(),
  statusId: z.string(),
});

export const ListClaimsResponseSchema = z.array(ClaimSummarySchema);
