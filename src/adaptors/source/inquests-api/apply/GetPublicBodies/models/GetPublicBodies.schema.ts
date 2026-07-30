import { z } from "zod";

export const GetPublicBodySchema = z.object({
  publicBodyId: z.string(),
  publicBodyDescription: z.string(),
});

export const GetPublicBodiesResponseSchema = z.array(GetPublicBodySchema);
