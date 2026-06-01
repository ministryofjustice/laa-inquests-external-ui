import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type {
  ClientCorrespondenceRecipient,
  ClientHomeAddress,
} from "#src/infrastructure/express/session/index.types.js";
import type { ClientDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { Formatter } from "#src/utils/Formatter.js";

export class ClientDetailsFormatter extends Formatter {
  toHomeAddressViewModel(clientHomeAddress: ClientHomeAddress | null): {
    homeAddressLine1: string;
    homeAddressLine2: string;
    homeTownOrCity: string;
    homeCounty: string;
    homePostcode: string;
    hasNoFixedAbode: boolean;
  } {
    if (clientHomeAddress === null) {
      return {
        homeAddressLine1: "",
        homeAddressLine2: "",
        homeTownOrCity: "",
        homeCounty: "",
        homePostcode: "",
        hasNoFixedAbode: false,
      };
    }

    const { addressLine1, addressLine2, townOrCity, county, postcode } =
      clientHomeAddress;

    return {
      homeAddressLine1: addressLine1,
      homeAddressLine2: addressLine2 ?? "",
      homeTownOrCity: townOrCity,
      homeCounty: county ?? "",
      homePostcode: postcode,
      hasNoFixedAbode: false,
    };
  }

  toCorrespondenceAddressViewModel(
    correspondenceAddress: ClientHomeAddress | null,
  ): {
    correspondenceAddressLine1: string;
    correspondenceAddressLine2: string;
    correspondenceTownOrCity: string;
    correspondenceCounty: string;
    correspondencePostcode: string;
  } {
    if (correspondenceAddress === null) {
      return {
        correspondenceAddressLine1: "",
        correspondenceAddressLine2: "",
        correspondenceTownOrCity: "",
        correspondenceCounty: "",
        correspondencePostcode: "",
      };
    }

    const { addressLine1, addressLine2, townOrCity, county, postcode } =
      correspondenceAddress;

    return {
      correspondenceAddressLine1: addressLine1,
      correspondenceAddressLine2: addressLine2 ?? "",
      correspondenceTownOrCity: townOrCity,
      correspondenceCounty: county ?? "",
      correspondencePostcode: postcode,
    };
  }

  buildClientHomeAddress(
    formBody: Partial<ClientDetailsFormData>,
  ): ClientHomeAddress {
    const {
      "home-address-line-1": addressLine1,
      "home-address-line-2": addressLine2,
      "home-town-or-city": townOrCity,
      "home-county": county,
      "home-postcode": postcode,
    } = formBody;

    const normalizedAddressLine2 =
      typeof addressLine2 === "string" && addressLine2.length > EMPTY_ARR_LENGTH
        ? addressLine2
        : null;
    const normalizedCounty =
      typeof county === "string" && county.length > EMPTY_ARR_LENGTH
        ? county
        : null;

    return {
      addressLine1: addressLine1 ?? "",
      addressLine2: normalizedAddressLine2,
      townOrCity: townOrCity ?? "",
      county: normalizedCounty,
      postcode: postcode ?? "",
    };
  }

  buildClientCorrespondenceAddress(
    formBody: Partial<ClientDetailsFormData>,
  ): ClientHomeAddress {
    const {
      "correspondence-address-line-1": addressLine1,
      "correspondence-address-line-2": addressLine2,
      "correspondence-town-or-city": townOrCity,
      "correspondence-county": county,
      "correspondence-postcode": postcode,
    } = formBody;

    const normalizedAddressLine2 =
      typeof addressLine2 === "string" && addressLine2.length > EMPTY_ARR_LENGTH
        ? addressLine2
        : null;
    const normalizedCounty =
      typeof county === "string" && county.length > EMPTY_ARR_LENGTH
        ? county
        : null;

    return {
      addressLine1: addressLine1 ?? "",
      addressLine2: normalizedAddressLine2,
      townOrCity: townOrCity ?? "",
      county: normalizedCounty,
      postcode: postcode ?? "",
    };
  }

  buildCorrespondenceRecipientViewModel(
    req: { session: Record<string, unknown> },
    recipient: ClientCorrespondenceRecipient | null,
    params?: {
      correspondenceRecipient?: string | undefined;
      personName?: string | undefined;
      organisationName?: string | undefined;
    },
  ): {
    correspondenceRecipient: string;
    correspondenceRecipientPersonName: string;
    correspondenceRecipientOrganisationName: string;
  } {
    return {
      correspondenceRecipient: this.#getRecipientTypeValue(
        req,
        recipient,
        params?.correspondenceRecipient,
      ),
      correspondenceRecipientPersonName: this.#getRecipientNameValue(
        recipient,
        params?.personName,
        "PERSON",
      ),
      correspondenceRecipientOrganisationName: this.#getRecipientNameValue(
        recipient,
        params?.organisationName,
        "ORGANISATION",
      ),
    };
  }

  getNoRecipientSelection(req: {
    session: Record<string, unknown>;
  }): "" | "NONE" {
    return req.session.clientCorrespondenceRecipient === null ? "NONE" : "";
  }

  #getRecipientTypeValue(
    req: { session: Record<string, unknown> },
    recipient: ClientCorrespondenceRecipient | null,
    overrideValue: string | undefined,
  ): string {
    return (
      overrideValue ??
      recipient?.recipientType ??
      this.getNoRecipientSelection(req)
    );
  }

  #getRecipientNameValue(
    recipient: ClientCorrespondenceRecipient | null,
    overrideValue: string | undefined,
    recipientType: "PERSON" | "ORGANISATION",
  ): string {
    if (overrideValue !== undefined) {
      return overrideValue;
    }

    return recipient?.recipientType === recipientType
      ? recipient.recipientName
      : "";
  }
}
