import { z } from "zod";
import { ApplicationSchema } from "./application.schema.js";

export type Application = z.infer<typeof ApplicationSchema>;