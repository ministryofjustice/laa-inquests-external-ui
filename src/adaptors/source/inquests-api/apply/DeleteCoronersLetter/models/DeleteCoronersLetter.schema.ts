import { z } from "zod";

export const DeleteCoronersLetterRequestSchema = z.object({
  coronersLetterId: z.string(),
});

export const DeleteCoronersLetterResponseSchema = z
  .object({
    status: z.string(),
    reason: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.status === "TECHNICAL_FAILURE" &&
      (typeof value.reason !== "string" || value.reason === "")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "TECHNICAL_FAILURE responses must include reason",
      });
    }
  });
