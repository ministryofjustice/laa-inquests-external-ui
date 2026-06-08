import type { Address } from "#src/domain/client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/client/CorrespondenceRecipient.js";

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
    clientCorrespondenceRecipient?: CorrespondenceRecipient | null;
    clientHasNoFixedAbode?: boolean;
    userId?: string;
    user?: { name?: string };
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

export type ClientHomeAddress = Address;

export type CorrespondenceAddressSource =
  | "USE_CLIENT_HOME_ADDRESS"
  | "USE_SPECIFIED_ADDRESS"
  | "USE_PROVIDER_ADDRESS";
