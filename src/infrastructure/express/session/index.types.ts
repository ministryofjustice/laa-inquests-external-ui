import type { PersistedAddress } from "#src/domain/client/Address.js";
import type { CorrespondenceAddressSource as DomainCorrespondenceAddressSource } from "#src/domain/client/CorrespondenceAddressSource.js";
import type { CorrespondenceRecipient as DomainCorrespondenceRecipient } from "#src/domain/client/CorrespondenceRecipient.js";
import type { Proceeding as DomainProceeding } from "#src/domain/proceedings/Proceeding.js";
import type { PublicAuthority as DomainPublicAuthority } from "#src/domain/publicAuthority/PublicAuthority.js";

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

export type Proceeding = DomainProceeding;

export type PublicAuthority = DomainPublicAuthority;

export type ClientHomeAddress = PersistedAddress;

export type CorrespondenceAddressSource = DomainCorrespondenceAddressSource;

export type ClientCorrespondenceRecipient = DomainCorrespondenceRecipient;

