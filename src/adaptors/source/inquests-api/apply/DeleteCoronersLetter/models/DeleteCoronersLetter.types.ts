import type { z } from "zod";
import type { DeleteCoronersLetterRequestSchema } from "./DeleteCoronersLetter.schema.js";

export type DeleteCoronersLetterRequest = z.infer<
  typeof DeleteCoronersLetterRequestSchema
>;

// Value-based protocol: a non-success delete is an expected outcome the widget
// surfaces inline, never an ApplicationError.
export type DeleteCoronersLetterResponse =
  { status: "SUCCESS" } | { status: "DELETE_REJECTED" };
