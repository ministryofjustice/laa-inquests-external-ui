import { z } from "zod";

export const SubmitApplicationRequestSchema = z.object({
  client: z.object({
    clientFirstName: z.string(),
    clientLastName: z.string(),
    clientLastNameAtBirth: z.string().optional(),
    clientDob: z.string(),
    clientNino: z.string().optional(),
    correspondenceAddress: z.string().optional(),
    homeAddress: z.string().optional(),
    relationshipToDeceased: z.string(),
  }),
  deceased: z.object({
    deceasedFirstName: z.string(),
    deceasedLastName: z.string(),
    deceasedDob: z.string(),
    deceasedDateOfDeath: z.string(),
    coronersReference: z.string(),
    furtherInformation: z.string(),
  }),
  proceedings: z.array(
    z.object({
      proceedingId: z.string(),
      proceedingDescription: z.string(),
    }),
  ),
  publicBodies: z.array(
    z.object({
      publicBodyDescription: z.string(),
    }),
  ),
});

export type SubmitApplicationRequest = z.infer<
  typeof SubmitApplicationRequestSchema
>;

export const SubmitApplicationResponseSchema = z.object({
  statusCode: z.number(),
  applicationReferenceNumber: z.string(),
});

export type SubmitApplicationResponse = z.infer<
  typeof SubmitApplicationResponseSchema
>;

export interface ApplySubmitPort {
  submitApplication: (
    body: SubmitApplicationRequest,
  ) => Promise<SubmitApplicationResponse>;
}
