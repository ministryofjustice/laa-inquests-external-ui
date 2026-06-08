import type { Address } from "#src/domain/client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/client/CorrespondenceRecipient.js";

export type CorrespondenceAddressSource =
  | "USE_CLIENT_HOME_ADDRESS"
  | "USE_SPECIFIED_ADDRESS"
  | "USE_PROVIDER_ADDRESS";

export interface ClientFields {
  clientFirstName: string;
  clientLastName: string;
  clientLastNameAtBirth: string | null;
  dateOfBirth: string;
  nationalInsuranceNumber: string | null;
  hasAppliedPreviously: boolean;
  prevApplicationReference: string | null;
  correspondenceAddressSource: CorrespondenceAddressSource;
  correspondenceAddress: Address | null;
  homeAddress: Address | null;
  hasNoFixedAbode: boolean;
  isClientCorrespondenceRecipient: boolean;
  correspondenceRecipient: CorrespondenceRecipient | null;
}

export class Client {
  readonly clientFirstName: string;
  readonly clientLastName: string;
  readonly clientLastNameAtBirth: string | null;
  readonly dateOfBirth: string;
  readonly nationalInsuranceNumber: string | null;
  readonly hasAppliedPreviously: boolean;
  readonly prevApplicationReference: string | null;
  readonly correspondenceAddressSource: CorrespondenceAddressSource;
  readonly correspondenceAddress: Address | null;
  readonly homeAddress: Address | null;
  readonly hasNoFixedAbode: boolean;
  readonly isClientCorrespondenceRecipient: boolean;
  readonly correspondenceRecipient: CorrespondenceRecipient | null;

  constructor(fields: ClientFields) {
    const {
      clientFirstName,
      clientLastName,
      clientLastNameAtBirth,
      dateOfBirth,
      nationalInsuranceNumber,
      hasAppliedPreviously,
      prevApplicationReference,
      correspondenceAddressSource,
      correspondenceAddress,
      homeAddress,
      hasNoFixedAbode,
      isClientCorrespondenceRecipient,
      correspondenceRecipient,
    } = fields;

    this.clientFirstName = clientFirstName;
    this.clientLastName = clientLastName;
    this.clientLastNameAtBirth = clientLastNameAtBirth;
    this.dateOfBirth = dateOfBirth;
    this.nationalInsuranceNumber = nationalInsuranceNumber;
    this.hasAppliedPreviously = hasAppliedPreviously;
    this.prevApplicationReference = prevApplicationReference;
    this.correspondenceAddressSource = correspondenceAddressSource;
    this.correspondenceAddress = correspondenceAddress;
    this.homeAddress = homeAddress;
    this.hasNoFixedAbode = hasNoFixedAbode;
    this.isClientCorrespondenceRecipient = isClientCorrespondenceRecipient;
    this.correspondenceRecipient = correspondenceRecipient;
  }
}
