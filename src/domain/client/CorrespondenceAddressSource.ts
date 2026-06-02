export const CORRESPONDENCE_ADDRESS_SOURCE = {
  USE_CLIENT_HOME_ADDRESS: "USE_CLIENT_HOME_ADDRESS",
  USE_SPECIFIED_ADDRESS: "USE_SPECIFIED_ADDRESS",
  USE_PROVIDER_ADDRESS: "USE_PROVIDER_ADDRESS",
} as const;

export type CorrespondenceAddressSource =
  (typeof CORRESPONDENCE_ADDRESS_SOURCE)[keyof typeof CORRESPONDENCE_ADDRESS_SOURCE];

export class CorrespondenceAddressSourceValue {
  static is(value: unknown): value is CorrespondenceAddressSource {
    return (
      value === CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS ||
      value === CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS ||
      value === CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS
    );
  }

  static parseOrNull(value: unknown): CorrespondenceAddressSource | null {
    return CorrespondenceAddressSourceValue.is(value) ? value : null;
  }

  static parseOrDefault(value: unknown): CorrespondenceAddressSource {
    return (
      CorrespondenceAddressSourceValue.parseOrNull(value) ??
      CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS
    );
  }
}

