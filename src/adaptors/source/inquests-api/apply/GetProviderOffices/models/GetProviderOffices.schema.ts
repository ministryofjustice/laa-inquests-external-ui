import { z } from "zod";

export const GetProviderOfficeAddressSchema = z.object({
  addressLine1: z.string(),
  addressLine2: z.string(),
  townOrCity: z.string(),
  county: z.string(),
  postcode: z.string(),
});

export const GetProviderOfficeSchema = z.object({
  officeCode: z.string(),
  address: GetProviderOfficeAddressSchema,
});

export const GetProviderOfficesResponseSchema = z.array(
  GetProviderOfficeSchema,
);
