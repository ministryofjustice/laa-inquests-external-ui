/* eslint-disable max-lines -- This adaptor orchestrates the full multi-page client-details journey. */
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Request, Response } from "express";
import type {
  ClientDetailsFormData,
  CorrespondenceAddressSourceValue,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type {
  ClientHomeAddress,
  Proceeding,
} from "#src/infrastructure/express/session/index.types.js";
import type { ClientDetailsValidator } from "./ClientDetails.validator.js";

export class ClientDetailsAdaptor {
  formValidator: ClientDetailsValidator;
  constructor(formValidator: ClientDetailsValidator) {
    this.formValidator = formValidator;
  }

  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/client-details/name-and-dob", {
      csrfToken,
      client: {
        clientFirstName: req.session.clientFirstName ?? "",
        clientLastName: req.session.clientLastName ?? "",
        clientLastNameAtBirth: req.session.clientLastNameAtBirth ?? "",
        hasNameChanged: req.session.hasNameChanged ?? "",
        clientDobDay: req.session.clientDobDay ?? "",
        clientDobMonth: req.session.clientDobMonth ?? "",
        clientDobYear: req.session.clientDobYear ?? "",
      },
    });
  }

  processNameForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: {
        "first-name": firstName,
        "last-name": lastName,
        "last-name-at-birth": lastNameAtBirth,
        "name-change": hasNameChanged,
        "dob-day": dobDay,
        "dob-month": dobMonth,
        "dob-year": dobYear,
      },
    } = req;
    req.session.clientFirstName = firstName;
    req.session.clientLastName = lastName;
    req.session.clientLastNameAtBirth = lastNameAtBirth;
    req.session.hasNameChanged = hasNameChanged;
    req.session.clientDobDay = dobDay;
    req.session.clientDobMonth = dobMonth;
    req.session.clientDobYear = dobYear;

    const nameErrors = this.formValidator.validateClientName(req.body);
    const dobErrors = this.formValidator.validateClientDob(req.body);

    if (
      Object.keys(nameErrors).length > EMPTY_ARR_LENGTH ||
      Object.keys(dobErrors).length > EMPTY_ARR_LENGTH
    ) {
      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorSummaries: { ...nameErrors, ...dobErrors },
        client: {
          clientFirstName: req.session.clientFirstName,
          clientLastName: req.session.clientLastName,
          clientLastNameAtBirth: req.session.clientLastNameAtBirth,
          hasNameChanged: req.session.hasNameChanged,
          clientDobDay: req.session.clientDobDay,
          clientDobMonth: req.session.clientDobMonth,
          clientDobYear: req.session.clientDobYear,
        },
      });
    } else {
      res.redirect("/apply/client-details/nino");
    }
  }

  renderNinoForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/nino", { csrfToken });
  }

  processNinoForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: { "has-nino": hasNino, "nino-input": ninoInput },
    } = req;

    req.session.clientHasNino = hasNino;
    req.session.clientNino = hasNino === "true" ? ninoInput : null;

    const ninoErrors = this.formValidator.validateNino(req.body);
    if (Object.keys(ninoErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/nino", {
        csrfToken,
        errorSummaries: ninoErrors,
        client: {
          hasNino: req.session.clientHasNino,
          clientNino: req.session.clientNino,
        },
      });
    } else {
      res.redirect("/apply/client-details/home-address");
    }
  }

  renderHomeAddressForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const clientHomeAddress = this.#getClientHomeAddress(req);
    const client = this.#toHomeAddressViewModel(clientHomeAddress);
    client.hasNoFixedAbode = this.#isClientNoFixedAbode(req);

    res.render("apply/client-details/home-address", {
      csrfToken,
      client,
    });
  }

  processHomeAddressForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: {
        "has-no-fixed-abode": hasNoFixedAbodeValue,
        "home-address-line-1": addressLine1,
        "home-address-line-2": addressLine2,
        "home-town-or-city": townOrCity,
        "home-county": county,
        "home-postcode": postcode,
      },
    } = req;

    const hasNoFixedAbode = hasNoFixedAbodeValue === "true";
    req.session.clientHasNoFixedAbode = hasNoFixedAbode;

    if (hasNoFixedAbode) {
      req.session.clientHomeAddress = undefined;
      res.redirect("/apply/client-details/correspondence-address-source");
      return;
    }

    const homeAddress = this.#buildClientHomeAddress({
      "home-address-line-1": addressLine1,
      "home-address-line-2": addressLine2,
      "home-town-or-city": townOrCity,
      "home-county": county,
      "home-postcode": postcode,
    });

    req.session.clientHomeAddress = homeAddress;

    const homeAddressErrors = this.formValidator.validateHomeAddress(req.body);
    const client = this.#toHomeAddressViewModel(homeAddress);

    if (Object.keys(homeAddressErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/home-address", {
        csrfToken,
        errorSummaries: homeAddressErrors,
        client,
      });
    } else {
      res.redirect("/apply/client-details/correspondence-address-source");
    }
  }

  renderCorrespondenceAddressSourceForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/correspondence-address-source", {
      csrfToken,
      client: {
        correspondenceAddressSource:
          this.#getClientCorrespondenceAddressSource(req) ?? "",
      },
    });
  }

  processCorrespondenceAddressSourceForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "correspondence-address-source": correspondenceAddressSource },
    } = req;

    const sourceErrors = this.formValidator.validateCorrespondenceAddressSource(
      req.body,
      this.#isClientNoFixedAbode(req),
    );

    if (Object.keys(sourceErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/correspondence-address-source", {
        csrfToken,
        errorSummaries: sourceErrors,
        client: {
          correspondenceAddressSource: correspondenceAddressSource ?? "",
        },
      });
      return;
    }

    if (!this.#isCorrespondenceAddressSource(correspondenceAddressSource)) {
      res.render("apply/client-details/correspondence-address-source", {
        csrfToken,
        errorSummaries: sourceErrors,
        client: {
          correspondenceAddressSource: "",
        },
      });
      return;
    }

    req.session.clientCorrespondenceAddressSource = correspondenceAddressSource;

    if (correspondenceAddressSource === "USE_SPECIFIED_ADDRESS") {
      res.redirect("/apply/client-details/correspondence-address");
      return;
    }

    req.session.clientCorrespondenceAddress = undefined;
    res.redirect("/apply/client-details/has-prev-application");
  }

  renderCorrespondenceAddressForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const correspondenceAddress = this.#getClientCorrespondenceAddress(req);
    res.render("apply/client-details/correspondence-address", {
      csrfToken,
      client: this.#toCorrespondenceAddressViewModel(correspondenceAddress),
    });
  }

  processCorrespondenceAddressForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const correspondenceAddress = this.#buildClientCorrespondenceAddress(
      req.body,
    );
    req.session.clientCorrespondenceAddress = correspondenceAddress;
    const correspondenceAddressErrors =
      this.formValidator.validateCorrespondenceAddress(req.body);

    if (Object.keys(correspondenceAddressErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/correspondence-address", {
        csrfToken,
        errorSummaries: correspondenceAddressErrors,
        client: this.#toCorrespondenceAddressViewModel(correspondenceAddress),
      });
      return;
    }

    res.redirect("/apply/client-details/has-prev-application");
  }

  renderHasPrevApplicationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/has-prev-application", { csrfToken });
  }

  processHasPrevApplicationForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: {
        "has-prev-application": hasPrevApplication,
        "prev-laa-reference-input": prevLaaReferenceInput,
      },
    } = req;

    req.session.clientHasPrevApplication = hasPrevApplication;
    req.session.prevLaaReferenceInput =
      hasPrevApplication === "true" ? prevLaaReferenceInput : null;

    const prevApplicationRefErrors =
      this.formValidator.validatePrevApplicationReference(req.body);

    if (Object.keys(prevApplicationRefErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/has-prev-application", {
        csrfToken,
        errorSummaries: prevApplicationRefErrors,
        client: {
          hasPrevApplication: req.session.clientHasPrevApplication,
          prevLaaReference: req.session.prevLaaReferenceInput,
        },
      });
    } else {
      const checkProceedings = (
        proceedings: Proceeding[] | undefined | null,
      ): boolean => proceedings !== undefined && proceedings !== null;
      const redirectUrl = checkProceedings(req.session.selectedProceedings)
        ? "/apply/proceedings/confirmation"
        : "/apply/proceedings";
      res.redirect(redirectUrl);
    }
  }

  #getClientHomeAddress(req: Request): ClientHomeAddress | null {
    const { session } = req;
    const { clientHomeAddress } = session;
    return this.#isClientHomeAddress(clientHomeAddress)
      ? clientHomeAddress
      : null;
  }

  #getClientCorrespondenceAddress(req: Request): ClientHomeAddress | null {
    const { session } = req;
    const { clientCorrespondenceAddress } = session;
    return this.#isClientHomeAddress(clientCorrespondenceAddress)
      ? clientCorrespondenceAddress
      : null;
  }

  #isClientHomeAddress(value: unknown): value is ClientHomeAddress {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    const candidate = value as Partial<ClientHomeAddress>;
    return (
      typeof candidate.addressLine1 === "string" &&
      typeof candidate.townOrCity === "string" &&
      typeof candidate.postcode === "string"
    );
  }

  #toHomeAddressViewModel(clientHomeAddress: ClientHomeAddress | null): {
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

  #toCorrespondenceAddressViewModel(
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

  #buildClientHomeAddress(
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

  #buildClientCorrespondenceAddress(
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

  #isCorrespondenceAddressSource(
    value: unknown,
  ): value is CorrespondenceAddressSourceValue {
    return (
      value === "USE_CLIENT_HOME_ADDRESS" ||
      value === "USE_SPECIFIED_ADDRESS" ||
      value === "USE_PROVIDER_ADDRESS"
    );
  }

  #getClientCorrespondenceAddressSource(
    req: Request,
  ): CorrespondenceAddressSourceValue | null {
    const { session } = req;
    return this.#isCorrespondenceAddressSource(
      session.clientCorrespondenceAddressSource,
    )
      ? session.clientCorrespondenceAddressSource
      : null;
  }

  #isClientNoFixedAbode(req: { session: Request["session"] }): boolean {
    return req.session.clientHasNoFixedAbode === true;
  }
}
