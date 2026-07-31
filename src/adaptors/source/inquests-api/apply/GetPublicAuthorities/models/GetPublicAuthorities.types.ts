import type { z } from "zod";
import type {
  GetPublicAuthoritySchema,
  GetPublicAuthoritiesResponseSchema,
} from "./GetPublicAuthorities.schema.js";

export type GetPublicAuthority = z.infer<typeof GetPublicAuthoritySchema>;

export type GetPublicAuthoritiesResponse = z.infer<
  typeof GetPublicAuthoritiesResponseSchema
>;
