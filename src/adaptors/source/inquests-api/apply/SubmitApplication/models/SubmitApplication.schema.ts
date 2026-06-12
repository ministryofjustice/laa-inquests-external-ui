import { z } from "zod";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
} from "#src/infrastructure/locales/constants.js";

export const SubmitApplicationRequestSchema = z.object({
  client: z
    .object({
      clientFirstName: z.string(),
      clientLastName: z.string(),
      clientLastNameAtBirth: z.string().optional().nullable(),
      dateOfBirth: z.string(),
      hasNoFixedAbode: z.boolean(),
      nationalInsuranceNumber: z.string().optional().nullable(),
      correspondenceAddressSource: z.enum([
        CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS,
        CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS,
        CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
      ]),
      correspondenceAddress: z
        .object({
          addressLine1: z.string(),
          addressLine2: z.string().optional().nullable(),
          townOrCity: z.string(),
          county: z.string().optional().nullable(),
          postcode: z.string(),
        })
        .optional()
        .nullable(),
      isClientCorrespondenceRecipient: z.boolean(),
      correspondenceRecipient: z
        .object({
          recipientType: z.enum([
            CORRESPONDENCE_RECIPIENT_TYPE.PERSON,
            CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION,
          ]),
          recipientName: z.string(),
        })
        .optional(),
      homeAddress: z
        .object({
          addressLine1: z.string(),
          addressLine2: z.string().optional().nullable(),
          townOrCity: z.string(),
          county: z.string().optional().nullable(),
          postcode: z.string(),
        })
        .optional()
        .nullable(),
    })
    .superRefine((client, ctx) => {
      if (client.isClientCorrespondenceRecipient) {
        if (client.correspondenceRecipient !== undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["correspondenceRecipient"],
            message:
              "correspondenceRecipient must not be provided when isClientCorrespondenceRecipient is true",
          });
        }
        return;
      }

      if (client.correspondenceRecipient === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["correspondenceRecipient"],
          message:
            "correspondenceRecipient is required when isClientCorrespondenceRecipient is false",
        });
      }
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
  provider: z.object({
    firmCode: z.string(),
    officeId: z.string(),
  }),
});

export const SubmitApplicationResponseSchema = z.object({
  statusCode: z.number(),
  laaReference: z.number(),
});
