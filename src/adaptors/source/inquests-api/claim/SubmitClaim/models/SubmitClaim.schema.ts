import { z } from "zod";
import { CLAIM_REJECTION_REASON_CODES } from "#src/infrastructure/locales/constants.js";

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

const SubmitClaimResponseBaseSchema = z.object({
  claimId: z.number(),
});

export const ClaimRejectionReasonCodeSchema = z.enum(
  CLAIM_REJECTION_REASON_CODES,
);

export const SubmitClaimResponseRejectedSchema =
  SubmitClaimResponseBaseSchema.extend({
    rejectionReasons: z.array(ClaimRejectionReasonCodeSchema).nonempty(),
  });

export const SubmitClaimResponseRejectedFallbackSchema =
  SubmitClaimResponseBaseSchema.extend({
    rejectionReasons: z.array(z.string()).nonempty(),
  });

export const SubmitClaimResponseAcceptedSchema = SubmitClaimResponseBaseSchema;

export const SubmitClaimResponseSchema = z.union([
  SubmitClaimResponseRejectedSchema,
  SubmitClaimResponseAcceptedSchema,
]);
