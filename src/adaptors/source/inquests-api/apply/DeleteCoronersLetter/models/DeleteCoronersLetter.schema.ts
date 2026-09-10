import { z } from "zod";

export const DeleteCoronersLetterRequestSchema = z.object({
  coronersLetterId: z.string(),
});
