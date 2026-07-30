import type { z } from "zod";
import type {
  GetPublicBodySchema,
  GetPublicBodiesResponseSchema,
} from "./GetPublicBodies.schema.js";

export type GetPublicBody = z.infer<typeof GetPublicBodySchema>;

export type GetPublicBodiesResponse = z.infer<
  typeof GetPublicBodiesResponseSchema
>;
