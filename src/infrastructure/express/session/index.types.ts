import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { ClaimRejectionReasonCode } from "#src/infrastructure/locales/constants.js";

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
    firmCode?: string;
    officeId?: string;
    accessToken?: string;
    coronersLetterId?: string;
    coronersLetterFileName?: string;
    providerEmail?: string;
    claimReferenceNumber?: string;
    claimRejectionReasons?: ClaimRejectionReasonCode[] | string[];
    claim?: ClaimSession;
  }
}

interface FormError {
  message?: string;
}

export interface ClaimSession {
  caseReference?: string;
  client?: ClaimClientDetails;
  searchResults?: ClaimClientDetails[];
  type?: string;
  subtype?: string;
  zeroVatTotal?: string;
  netTotal?: string;
  grossTotal?: string;
}

export interface ClaimClientDetails {
  reference: string;
  clientName: string;
  clientFirstName: string;
  clientLastName: string;
  dateOfBirth: string;
}

export interface Proceeding {
  proceedingId: string;
  proceedingName: string;
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
