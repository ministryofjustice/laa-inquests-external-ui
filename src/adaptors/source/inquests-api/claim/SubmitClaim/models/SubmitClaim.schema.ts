import { z } from "zod";

export const SubmitClaimApiErrorSchema = z.object({
  errorCode: z.string(),
});

export const SubmitClaimRequestSchema = z.object({
  claimType: z.string(),
  totalProfitCostVatZero: z.number().optional().nullable(),
  totalProfitCostNet: z.number().optional().nullable(),
  totalProfitCostGross: z.number().nullable(),
  poaTypeId: z.string(),
  claimantId: z.string(),
});

export const SubmitClaimResponseSchema = z.object({
  claimId: z.number(),
  laaReference: z.number(),
  claimTypeId: z.string(),
  statusId: z.string(),
  submissionDate: z.string(),
  totalProfitCostVatZero: z.number().optional().nullable(),
  totalProfitCostNet: z.number().optional().nullable(),
  totalProfitCostGross: z.number().optional().nullable(),
  claimantId: z.string(),
  poaTypeId: z.string(),
});
