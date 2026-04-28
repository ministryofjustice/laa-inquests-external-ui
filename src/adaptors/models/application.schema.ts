import { z } from "zod";

export const ApplicationSchema = z.object({
  applicationId: z.string(), // x
  status: z.nullish(z.string()),
  laaReference: z.string(), //x
  isLead: z.nullish(z.boolean()),
  usedDelegatedFunctions: z.nullish(z.boolean()), // INCORRECT NAMING IN DS (useDelegatedFunctions)
  applicationType: z.nullish(z.string()),
  // provider: z.object({
  //   officeCode: z.nullish(z.string()),
  //   providerEmail: z.nullish(z.string()),
  // }),
  // overallDecision: z.nullish(z.string()),
  // autoGrant: z.nullish(z.boolean()),
  // client: z.nullish(ClientSchema),
  // documents: z.nullish(z.array(DocumentSchema)),
  // notes: z.nullish(z.array(ApplicationNoteSchema)),
  // opponents: z.nullish(z.array(OpponentSchema)),
  // proceedings: z.nullish(z.array(ProceedingSchema)),
})
