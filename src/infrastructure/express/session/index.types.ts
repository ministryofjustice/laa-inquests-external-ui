declare module "express-session" {
  interface SessionData extends Record<
    string,
    Record<string, unknown> | string | boolean | undefined | null
  > {
    // This allows both specific properties and dynamic namespace access
    error: FormError;
    selectedProceedings?: Proceeding[];
    selectedPublicAuthorities?: PublicAuthority[];
    clientHomeAddress?: ClientHomeAddress;
    clientCorrespondenceAddress?: ClientHomeAddress;
    clientCorrespondenceAddressSource?: CorrespondenceAddressSource;
    clientCorrespondenceRecipient?: ClientCorrespondenceRecipient | null;
    clientHasNoFixedAbode?: boolean;
  }
}

interface FormError {
  message?: string;
}

export interface Proceeding {
  proceedingId: string;
  proceedingDescription: string;
  matterType: string;
}

export interface PublicAuthority {
  publicAuthorityId: string;
  publicAuthorityDescription: string;
}

export interface ClientHomeAddress {
  addressLine1: string;
  addressLine2?: string | null;
  townOrCity: string;
  county?: string | null;
  postcode: string;
}

export type CorrespondenceAddressSource =
  | "USE_CLIENT_HOME_ADDRESS"
  | "USE_SPECIFIED_ADDRESS"
  | "USE_PROVIDER_ADDRESS";

export interface ClientCorrespondenceRecipient {
  recipientType: "PERSON" | "ORGANISATION";
  recipientName: string;
}
