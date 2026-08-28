import { z } from "zod";
import { CLAIM_REJECTION_REASON_CODES } from "#src/infrastructure/locales/constants.js";

export const SubmitClaimApiErrorSchema = z.object({
  errorCode: z.string(),
  message: z.string().optional(),
});

const SubmitClaimApiErrorNestedSchema = z.object({
  detail: SubmitClaimApiErrorSchema,
});

export const NormalisedSubmitClaimApiErrorSchema = z
  .union([SubmitClaimApiErrorSchema, SubmitClaimApiErrorNestedSchema])
  .transform((value) => ("detail" in value ? value.detail : value));

export const SubmitClaimRequestSchema = z.object({
  claimType: z.string(),
  totalProfitCostVatZero: z.number().optional().nullable(),
  totalProfitCostNet: z.number().optional().nullable(),
  totalProfitCostGross: z.number().nullable(),
  poaTypeId: z.string().optional().nullable(),
  claimantId: z.string(),
  claimEvidenceIds: z.array(z.string()).nonempty(),
  inquestOutcomes: z.array(z.string()).optional(),
  claimCostTemplateFile: z
    .object({
      claimCostTemplateFileId: z.string(),
      claimCostTemplateFileName: z.string(),
    })
    .optional()
    .nullable(),
  hasCounselBeenPaid: z.boolean().optional().nullable(),
  hasAlternativeFunding: z.boolean().optional().nullable(),
  hasRecoveryCostsAwarded: z.boolean().optional().nullable(),
  financialRecoveryPreviousPreCertificateCosts: z
    .number()
    .optional()
    .nullable(),
  financialRecoveryCost: z.number().optional().nullable(),
  financialRecoveryDamages: z.number().optional().nullable(),
  financialRecoveryInterest: z.number().optional().nullable(),
  payingParty: z.string().optional().nullable(),
  numberOfCounselInstructed: z.string().optional().nullable(),
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
