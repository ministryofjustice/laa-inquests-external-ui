import { Address } from "#src/domain/client/Address.js";
import { CorrespondencePolicy } from "#src/domain/client/CorrespondencePolicy.js";
import type {
  ClientCorrespondenceRecipient,
  ClientHomeAddress,
} from "#src/infrastructure/express/session/index.types.js";
import type { ClientDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { Formatter } from "#src/utils/Formatter.js";

export class ClientDetailsFormatter extends Formatter {
  // # TODO Step 5: Move this to presenter view-model mappers only; move business normalization to domain/application services.
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
    return Address.fromFormFields({
      addressLine1: formBody["home-address-line-1"],
      addressLine2: formBody["home-address-line-2"],
      townOrCity: formBody["home-town-or-city"],
      county: formBody["home-county"],
      postcode: formBody["home-postcode"],
    }).toPersisted();
  }

  buildClientCorrespondenceAddress(
    formBody: Partial<ClientDetailsFormData>,
  ): ClientHomeAddress {
    return Address.fromFormFields({
      addressLine1: formBody["correspondence-address-line-1"],
      addressLine2: formBody["correspondence-address-line-2"],
      townOrCity: formBody["correspondence-town-or-city"],
      county: formBody["correspondence-county"],
      postcode: formBody["correspondence-postcode"],
    }).toPersisted();
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
    // # TODO Step 5: Move this to a dedicated presenter view-model mapper if it remains presentation-only.
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
    return CorrespondencePolicy.defaultRecipientSelection(
      req.session.clientCorrespondenceRecipient as ClientCorrespondenceRecipient | null,
    );
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
