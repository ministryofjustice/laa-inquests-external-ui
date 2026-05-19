import { SubmitApplicationRequestSchema, SubmitApplicationResponseSchema } from "./SubmitApplication.schema.js";
import { z } from "zod";

export type SubmitApplicationRequest = z.infer<
  typeof SubmitApplicationRequestSchema
>;

export type SubmitApplicationResponse = z.infer<
  typeof SubmitApplicationResponseSchema
>;