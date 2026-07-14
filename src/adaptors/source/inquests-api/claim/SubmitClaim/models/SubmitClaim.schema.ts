import { z } from "zod";

export const SubmitClaimApiErrorSchema = z.object({
  errorCode: z.string(),
});

export const SubmitClaimRequestSchema = z.object({
  claimType: z.string(),
  totalProfitCostVatZero: z.number(),
  totalProfitCostNet: z.number(),
  totalProfitCostGross: z.number(),
  poaTypeId: z.string(),
  claimantId: z.string(),
});

export const SubmitClaimResponseSchema = z.object({
  claimId: z.number(),
  laaReference: z.number(),
  claimTypeId: z.string(),
  statusId: z.string(),
  submissionDate: z.string(),
  totalProfitCostNet: z.number(),
  totalProfitCostGross: z.number(),
  claimantId: z.string(),
  poaTypeId: z.string(),
});
