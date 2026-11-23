import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import type { ClaimRejectionReasonCode } from "#src/infrastructure/locales/constants.js";
import type { ProviderRole } from "#src/infrastructure/config/accessControl.js";

declare module "express-session" {
  // Epoch milliseconds, except idleTimeoutMs which is a duration.
  interface SessionLifetime {
    absoluteExpiresAt: number;
    credentialExpiresAt: number;
    lastActivityAt: number;
    idleTimeoutMs: number;
  }

  interface SessionData extends Record<
    string,
    Record<string, unknown> | string | boolean | number | undefined | null
  > {
    // This allows both specific properties and dynamic namespace access
    lastCompletedStepIndex?: number;
    journeyType?: number;
    visitedJourneyPages?: string[];
    error: FormError;
    selectedProceeding?: Proceeding;
    proceedingOption?: Proceeding;
    availablePublicAuthorities?: PublicAuthority[];
    selectedPublicAuthorities?: PublicAuthority[];
    clientHomeAddress?: ClientHomeAddress;
    clientCorrespondenceAddress?: ClientHomeAddress;
    clientCorrespondenceAddressSource?: CorrespondenceAddressSource;
    clientCorrespondenceRecipient?: CorrespondenceRecipient | null;
    clientHasNoFixedAbode?: boolean;
    userId?: string;
    user?: { name?: string };
    firmId?: string;
    firmName?: string;
    selectedOfficeId?: string;
    selectedOfficeAddress?: string;
    userOfficeAccounts?: string[];
    roles?: ProviderRole[];
    accessToken?: string;
    coronersLetterId?: string;
    coronersLetterFileName?: string;
    providerEmail?: string;
    claimReferenceNumber?: string;
    claimRejectionReasons?: ClaimRejectionReasonCode[] | string[];
    claim?: ClaimSession;
    returnToApplyCheckYourAnswers?: boolean;
    claimDeclaration?: boolean;
    lifetime?: SessionLifetime;
    returnTo?: string;
    cookieBannerState?: string;
  }
}

interface FormError {
  message?: string;
}

export interface ClaimSession {
  caseReference?: string;
  officeId?: string;
  client?: ClaimClientDetails;
  searchResults?: ClaimSearchResult[];
  claimBlocked?: boolean;
  type?: string;
  subtype?: string;
  zeroVatTotal?: string;
  netTotal?: string;
  grossTotal?: string;
  evidenceFiles?: ClaimEvidenceFile[];
  finalBillCostTemplate?: ClaimFinalBillCostTemplate;
  counselNumber?: string;
  counselBillsPaid?: boolean;
  returnToCheckYourAnswers?: boolean;
  endDateDay?: string;
  endDateMonth?: string;
  endDateYear?: string;
  inquestOutcomes?: string[];
  fundingPostInquest?: string;
  recoveryCostMade?: string;
  recoveryCosts?: string;
  recoveryDamages?: string;
  recoveryInterest?: string;
  recoveryPreCertificateCosts?: string;
  preCertificateCosts?: string;
  recoveryCostMadeEditInProgress?: boolean;
  payingParty?: string;
}

export interface ClaimEvidenceFile {
  id: string;
  fileName: string;
  fileSize?: number;
}

export interface ClaimFinalBillCostTemplate {
  costTemplateId: string;
  costTemplateFilename: string;
  costTemplateFileSize?: number;
}

export interface ClaimClientDetails {
  reference: string;
  clientName: string;
  clientFirstName: string;
  clientLastName: string;
  dateOfBirth: string;
}

export interface ClaimSearchResult extends ClaimClientDetails {
  officeId: string;
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
  "USE_CLIENT_HOME_ADDRESS" | "USE_SPECIFIED_ADDRESS" | "USE_PROVIDER_ADDRESS";
