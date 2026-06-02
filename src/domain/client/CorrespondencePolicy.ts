import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  type CorrespondenceAddressSource,
} from "#src/domain/client/CorrespondenceAddressSource.js";
import type {
  CorrespondenceRecipient,
  CorrespondenceRecipientSelection,
} from "#src/domain/client/CorrespondenceRecipient.js";

export class CorrespondencePolicy {
  static canUseAddressSource(
    source: CorrespondenceAddressSource,
    hasNoFixedAbode: boolean,
  ): boolean {
    return !(
      source === CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS &&
      hasNoFixedAbode
    );
  }

  static defaultRecipientSelection(
    recipient: CorrespondenceRecipient | null,
  ): "" | "NONE" {
    return recipient === null ? "NONE" : "";
  }

  static isClientCorrespondenceRecipient(
    recipient: CorrespondenceRecipient | null,
  ): boolean {
    return recipient === null;
  }

  static shouldUseSpecifiedAddress(
    source: CorrespondenceAddressSource,
  ): boolean {
    return source === CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS;
  }

  static shouldUseHomeAddress(hasNoFixedAbode: boolean): boolean {
    return !hasNoFixedAbode;
  }

  static createRecipient(
    selection: CorrespondenceRecipientSelection,
    personName: string | undefined,
    organisationName: string | undefined,
    buildRecipient: (
      selection: CorrespondenceRecipientSelection,
      personName: string | undefined,
      organisationName: string | undefined,
    ) => CorrespondenceRecipient | null,
  ): CorrespondenceRecipient | null {
    return buildRecipient(selection, personName, organisationName);
  }
}

