import { z } from "zod";

export const SaveCoronersLetterRequestSchema = z.object({
  coronersLetter: z.string(),
});

export const SaveCoronersLetterResponseSchema = z.object({
  statusCode: z.number(),
});
