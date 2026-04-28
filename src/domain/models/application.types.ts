import { z } from "zod";
import {
  applicationTypeOptions,
  overallDecisionStateOptions,
} from "#src/domain/models/common/options.types.js";
import {
  Status,
} from "#src/domain/models/common/index.types.js";

export const ApplicationSchema = z.object({
  application_id: z.string(),
  laa_reference: z.string(),
  status: Status,
  application_type: z.enum(applicationTypeOptions),
  auto_grant: z.boolean(),
  is_lead: z.boolean(),
  last_updated: z.string(),
  overall_decision: z.enum(overallDecisionStateOptions),
  submitted_at: z.string(),
  used_delegated_functions: z.boolean(),
  // client: ClientSchema,
  // documents: z.array(DocumentSchema),
  // notes: z.array(ApplicationNoteSchema),
  // opponents: z.array(OpponentSchema),
  // proceedings: z.array(ProceedingSchema),
  // provider: ProviderSchema,
});

export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationResponseSchema = z.object({
  application: ApplicationSchema,
});

export type ApplicationResponse = z.infer<
  typeof ApplicationResponseSchema
>;
