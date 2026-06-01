declare module "express-session" {
  interface SessionData extends Record<
    string,
    Record<string, unknown> | string | boolean | undefined | null
  > {
    // # TODO Step 1: Move this to application session DTO mapping that reconstructs domain aggregates.
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
  // # TODO Step 1: Move this to domain/proceedings/Proceeding.ts and keep this file transport/session-only.
  proceedingId: string;
  proceedingDescription: string;
  matterType: string;
}

export interface PublicAuthority {
  // # TODO Step 1: Move this to domain/publicAuthority/PublicAuthority.ts.
  publicAuthorityId: string;
  publicAuthorityDescription: string;
}

export interface ClientHomeAddress {
  // # TODO Step 1: Move this to domain/client/Address.ts.
  addressLine1: string;
  addressLine2?: string | null;
  townOrCity: string;
  county?: string | null;
  postcode: string;
}

export type CorrespondenceAddressSource =
  // # TODO Step 1: Move this to domain/client/CorrespondenceAddressSource.ts.
  | "USE_CLIENT_HOME_ADDRESS"
  | "USE_SPECIFIED_ADDRESS"
  | "USE_PROVIDER_ADDRESS";

export interface ClientCorrespondenceRecipient {
  // # TODO Step 1: Move this to domain/client/CorrespondenceRecipient.ts.
  recipientType: "PERSON" | "ORGANISATION";
  recipientName: string;
}
