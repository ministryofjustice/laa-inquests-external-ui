import type {
  SubmitApplicationRequestSchema,
  SubmitApplicationResponseSchema,
} from "./SubmitApplication.schema.js";
import type { z } from "zod";

export type SubmitApplicationRequest = z.infer<
  typeof SubmitApplicationRequestSchema
>;

export type SubmitApplicationResponse = z.infer<
  typeof SubmitApplicationResponseSchema
>;
