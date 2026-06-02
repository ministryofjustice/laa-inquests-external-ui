import { CORRESPONDENCE_RECIPIENT_TYPE } from "#src/infrastructure/locales/constants.js";

export interface CorrespondenceRecipient {
  recipientType: "PERSON" | "ORGANISATION";
  recipientName: string;
}

export type CorrespondenceRecipientSelection =
  | CorrespondenceRecipient["recipientType"]
  | "NONE";

export class CorrespondenceRecipientValue {
  static is(value: unknown): value is CorrespondenceRecipient {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const candidate = value as Partial<CorrespondenceRecipient>;
    return (
      (candidate.recipientType === CORRESPONDENCE_RECIPIENT_TYPE.PERSON ||
        candidate.recipientType ===
          CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION) &&
      typeof candidate.recipientName === "string"
    );
  }

  static fromUnknown(value: unknown): CorrespondenceRecipient | null {
    return CorrespondenceRecipientValue.is(value) ? value : null;
  }

  static isSelection(value: unknown): value is CorrespondenceRecipientSelection {
    return (
      value === CORRESPONDENCE_RECIPIENT_TYPE.PERSON ||
      value === CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION ||
      value === "NONE"
    );
  }

  static parseSelection(value: unknown): CorrespondenceRecipientSelection | null {
    return CorrespondenceRecipientValue.isSelection(value) ? value : null;
  }

  static buildFromSelection(
    selection: CorrespondenceRecipientSelection,
    personName: string | undefined,
    organisationName: string | undefined,
  ): CorrespondenceRecipient | null {
    if (selection === "NONE") {
      return null;
    }

    const recipientName =
      selection === CORRESPONDENCE_RECIPIENT_TYPE.PERSON
        ? personName
        : organisationName;

    return {
      recipientType: selection,
      recipientName: recipientName ?? "",
    };
  }
}

