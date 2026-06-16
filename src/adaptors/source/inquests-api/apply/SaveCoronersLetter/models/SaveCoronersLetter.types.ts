import type { z } from "zod";
import type {
  SaveCoronersLetterRequestSchema,
  SaveCoronersLetterResponseSchema,
} from "./SaveCoronersLetter.schema.js";

export type SaveCoronersLetterRequest = z.infer<
  typeof SaveCoronersLetterRequestSchema
>;

export type SaveCoronersLetterResponse = z.infer<
  typeof SaveCoronersLetterResponseSchema
>;
