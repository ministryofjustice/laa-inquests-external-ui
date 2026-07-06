import type { z } from "zod";
import type {
  SearchCaseSchema,
  SearchCasesResponseSchema,
} from "./SearchCases.schema.js";

export interface SearchCasesRequest {
  laaReference: string;
}

export type SearchCase = z.infer<typeof SearchCaseSchema>;
export type SearchCasesResponse = z.infer<typeof SearchCasesResponseSchema>;
