import { z } from "zod";

export const SearchCaseSchema = z.object({
  laaReference: z.number(),
  clientName: z.string(),
  clientDateOfBirth: z.string(),
  dateSubmitted: z.string(),
  firmName: z.string().nullable(),
  firmNumber: z.string(),
  overallDecision: z.string(),
});

export const SearchCasesResponseSchema = z.array(SearchCaseSchema);
