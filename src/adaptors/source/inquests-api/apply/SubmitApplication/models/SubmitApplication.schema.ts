import { z } from "zod";

export const SubmitApplicationRequestSchema = z.object({
  client: z.object({
    clientFirstName: z.string(),
    clientLastName: z.string(),
    clientLastNameAtBirth: z.string().optional().nullable(),
    dateOfBirth: z.string(),
    nationalInsuranceNumber: z.string().optional().nullable(),
    correspondenceAddress: z.string().optional().nullable(),
    homeAddress: z.string().optional().nullable(),
  }),
  deceased: z.object({
    deceasedFirstName: z.string(),
    deceasedLastName: z.string(),
    deceasedDateOfBirth: z.string(),
    deceasedDateOfDeath: z.string(),
    coronersReference: z.string(),
    furtherInformation: z.string(),
    clientRelationshipToDeceased: z.string(),
  }),
  proceedings: z.array(
    z.object({
      proceedingId: z.string(),
    }),
  ),
  publicBodies: z.array(
    z.object({
      publicBodyId: z.string(),
    }),
  ),
});

export const SubmitApplicationResponseSchema = z.object({
  statusCode: z.number(),
  laaReference: z.number(),
});
