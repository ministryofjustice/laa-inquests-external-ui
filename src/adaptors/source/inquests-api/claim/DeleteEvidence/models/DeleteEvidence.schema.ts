import { z } from "zod";

export const DeleteEvidenceRequestSchema = z.object({
  evidenceFileId: z.string(),
});
