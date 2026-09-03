import { z } from "zod";

export const SearchCaseSchema = z.object({
  laaReference: z
    .union([z.number(), z.string()])
    .transform((val) => String(val)),
  clientFirstName: z.string(),
  clientLastName: z.string(),
  clientDateOfBirth: z.string(),
  dateSubmitted: z.string(),
  firmName: z.string().nullable(),
  firmNumber: z.string(),
  overallDecision: z.string(),
});

export const SearchCasesResponseSchema = z.array(SearchCaseSchema);
