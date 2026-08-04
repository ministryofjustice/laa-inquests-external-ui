import { z } from "zod";

export const GetPublicAuthoritySchema = z.object({
  publicBodyId: z.string(),
  publicBodyDescription: z.string(),
});

export const GetPublicAuthoritiesResponseSchema = z.array(
  GetPublicAuthoritySchema,
);
