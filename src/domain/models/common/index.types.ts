import { z } from "zod";
import {
  categoryOfLawOptions,
  certificateOptions,
  clientInvolvementOptions,
  matterTypeOptions,
  meansMeritsDecisionStateOptions,
  overallDecisionStateOptions,
  inquestsProceedingTypeOptions,
  statusOptions,
} from "#src/domain/models/common/options.types.js";

export const Status = z.enum(statusOptions);
export const MeansMeritDecisionState = z.enum(meansMeritsDecisionStateOptions);
export const OverallDecisionState = z.enum(overallDecisionStateOptions);
export const CategoryOfLaw = z.enum(categoryOfLawOptions);
export const MatterTypes = z.enum(matterTypeOptions);
export const ProceedingTypes = z.enum(inquestsProceedingTypeOptions);

export const ClientSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  lastNameAtBirth: z.nullable(z.string()),
  dateOfBirth: z.string(),
  nationalInsuranceNumber: z.string(),
  correspondenceAddress: z.nullable(z.string()),
  homeAddress: z.nullable(z.string()),
});
export const DocumentSchema = z.object({
  title: z.string(),
  link: z.string(),
});

export const OpponentSchema = z.object({
  firstName: z.nullish(z.string()),
  lastName: z.nullish(z.string()),
  organisation: z.nullish(z.string()),
});

export const ProceedingSchema = z.object({
  proceedingType: z.enum(inquestsProceedingTypeOptions),
  clientInvolvementType: z.enum(clientInvolvementOptions),
  certificateType: z.enum(certificateOptions),
  categoryOfLaw: CategoryOfLaw,
  matterType: MatterTypes,
});

export const EventHistorySchema = z.object({
  service: z.string(),
  eventDescription: z.string(),
});

export type EventHistory = z.infer<typeof EventHistorySchema>;

export const UserSchema = z.object({
  businessPhones: z.array(z.string()),
  displayName: z.string(),
  givenName: z.string(),
  jobTitle: z.string().nullable(),
  mail: z.string(),
  mobilePhone: z.string().nullable(),
  officeLocation: z.string().nullable(),
  preferredLanguage: z.string(),
  surname: z.string(),
  userPrincipalName: z.string().nullable(),
});

export const ProviderAddressSchema = z.optional(
  z.object({
    addressLine1: z.nullable(z.string()),
    addressLine2: z.nullable(z.string()),
    addressLine3: z.nullable(z.string()),
    addressLine4: z.nullable(z.string()),
    city: z.nullable(z.string()),
    county: z.nullable(z.string()),
    postCode: z.nullable(z.string()),
  }),
);

export const ProviderSchema = z.object({
  officeCode: z.string(),
  providerEmail: z.string(),
  firmId: z.optional(z.number()),
  firmName: z.optional(z.string()),
  officeAddress: ProviderAddressSchema,
  firmPhone: z.optional(z.string()),
});

export type Client = z.infer<typeof ClientSchema>;

export type Provider = z.infer<typeof ProviderSchema>;

export type Proceeding = z.infer<typeof ProceedingSchema>;

export type Opponent = z.infer<typeof OpponentSchema>;

export type Document = z.infer<typeof DocumentSchema>;


export type Status = z.infer<typeof Status>;


export type OverallDecisionState = z.infer<typeof OverallDecisionState>;

export type ProceedingType = z.infer<typeof ProceedingTypes>;

export type MatterType = z.infer<typeof MatterTypes>;

export type CategoryOfLaw = z.infer<typeof CategoryOfLaw>;
