import type { z } from "zod";
import type {
  GetProviderOfficeSchema,
  GetProviderOfficesResponseSchema,
} from "./GetProviderOffices.schema.js";

export type GetProviderOffice = z.infer<typeof GetProviderOfficeSchema>;

export type GetProviderOfficesResponse = z.infer<
  typeof GetProviderOfficesResponseSchema
>;
