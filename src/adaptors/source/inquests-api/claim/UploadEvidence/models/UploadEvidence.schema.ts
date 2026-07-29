import { z } from "zod";

export const UploadEvidenceRequestSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimetype: z.string(),
  originalname: z.string(),
});

export const UploadEvidenceResponseSchema = z
  .object({
    status: z.string(),
    evidenceFileId: z.string().optional(),
    evidenceFileName: z.string().optional(),
    reason: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.status === "SUCCESS" &&
      (typeof value.evidenceFileId !== "string" ||
        value.evidenceFileId === "" ||
        typeof value.evidenceFileName !== "string" ||
        value.evidenceFileName === "")
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "SUCCESS responses must include evidenceFileId and evidenceFileName",
      });
    }
  });
