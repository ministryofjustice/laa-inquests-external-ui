import type { z } from "zod";
import type {
  UploadCoronersLetterRequestSchema,
  UploadCoronersLetterResponseSchema,
} from "./UploadCoronersLetter.schema.js";

export type UploadCoronersLetterRequest = z.infer<
  typeof UploadCoronersLetterRequestSchema
>;

export type UploadCoronersLetterResponse = z.infer<
  typeof UploadCoronersLetterResponseSchema
>;
