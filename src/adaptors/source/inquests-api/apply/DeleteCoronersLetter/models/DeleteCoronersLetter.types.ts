import type { z } from "zod";
import type {
  DeleteCoronersLetterRequestSchema,
  DeleteCoronersLetterResponseSchema,
} from "./DeleteCoronersLetter.schema.js";

export type DeleteCoronersLetterRequest = z.infer<
  typeof DeleteCoronersLetterRequestSchema
>;

export type DeleteCoronersLetterResponse = z.infer<
  typeof DeleteCoronersLetterResponseSchema
>;
