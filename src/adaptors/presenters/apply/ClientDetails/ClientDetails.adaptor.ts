/* eslint-disable max-lines -- This adaptor orchestrates the full multi-page client-details journey. */
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Request, Response } from "express";
import type {
  ClientDetailsFormData,
  CorrespondenceAddressSourceValue,
  CorrespondenceRecipientSelectionValue,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import {
  CORRESPONDENCE_RECIPIENT_TYPE,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { ClientDetailsValidator } from "./ClientDetails.validator.js";
import { ClientDetailsFormatter } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.js";
import type { Address } from "#src/domain/Client/Address.js";
import { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";

export class ClientDetailsAdaptor {
  formValidator: ClientDetailsValidator;
  formatter: ClientDetailsFormatter;
  constructor(
    formValidator: ClientDetailsValidator,
    formatter: ClientDetailsFormatter = new ClientDetailsFormatter(),
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
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
      res.redirect("/apply/client-details/has-prev-application");
    }
  }

  renderHomeAddressForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const clientHomeAddress = this.#getClientHomeAddress(req);
    const client = this.formatter.toHomeAddressViewModel(clientHomeAddress);
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

    const homeAddress = this.formatter.buildClientHomeAddress({
      "home-address-line-1": addressLine1,
      "home-address-line-2": addressLine2,
      "home-town-or-city": townOrCity,
      "home-county": county,
      "home-postcode": postcode,
    });

    req.session.clientHomeAddress = homeAddress;

    const homeAddressErrors = this.formValidator.validateHomeAddress(req.body);
    const client = this.formatter.toHomeAddressViewModel(homeAddress);

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
    } else if (correspondenceAddressSource === "USE_SPECIFIED_ADDRESS") {
      req.session.clientCorrespondenceAddressSource =
        correspondenceAddressSource;
      res.redirect("/apply/client-details/correspondence-address");
    } else if (
      correspondenceAddressSource === "USE_CLIENT_HOME_ADDRESS" ||
      correspondenceAddressSource === "USE_PROVIDER_ADDRESS"
    ) {
      req.session.clientCorrespondenceAddress = undefined;
      req.session.clientCorrespondenceAddressSource =
        correspondenceAddressSource;
      res.redirect("/apply/client-details/correspondence-recipient");
    } else {
      res.render("apply/client-details/correspondence-address-source", {
        csrfToken,
        errorSummaries: sourceErrors,
        client: {
          correspondenceAddressSource: "",
        },
      });
    }
  }

  renderCorrespondenceAddressForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const correspondenceAddress = this.#getClientCorrespondenceAddress(req);
    res.render("apply/client-details/correspondence-address", {
      csrfToken,
      client: this.formatter.toCorrespondenceAddressViewModel(
        correspondenceAddress,
      ),
    });
  }

  processCorrespondenceAddressForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const correspondenceAddress =
      this.formatter.buildClientCorrespondenceAddress(req.body);
    req.session.clientCorrespondenceAddress = correspondenceAddress;
    const correspondenceAddressErrors =
      this.formValidator.validateCorrespondenceAddress(req.body);

    if (Object.keys(correspondenceAddressErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/correspondence-address", {
        csrfToken,
        errorSummaries: correspondenceAddressErrors,
        client: this.formatter.toCorrespondenceAddressViewModel(
          correspondenceAddress,
        ),
      });
    } else {
      res.redirect("/apply/client-details/correspondence-recipient");
    }
  }

  renderCorrespondenceRecipientForm(
    req: { session: Request["session"] },
    res: Response,
    params?: {
      errorSummaries?: Record<string, unknown>;
      correspondenceRecipient?: string | undefined;
      personName?: string | undefined;
      organisationName?: string | undefined;
    },
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const recipient = this.#getClientCorrespondenceRecipient(req);
    const client = this.formatter.buildCorrespondenceRecipientViewModel(
      req,
      recipient,
      params,
    );

    res.render("apply/client-details/correspondence-recipient", {
      csrfToken,
      errorSummaries: params?.errorSummaries,
      client,
    });
  }

  processCorrespondenceRecipientForm(
    req: TypedRequestBody<Partial<ClientDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        "correspondence-recipient": correspondenceRecipient,
        "correspondence-recipient-person-name": personName,
        "correspondence-recipient-organisation-name": organisationName,
      },
    } = req;

    const recipientErrors = this.formValidator.validateCorrespondenceRecipient(
      req.body,
    );

    if (Object.keys(recipientErrors).length > EMPTY_ARR_LENGTH) {
      this.renderCorrespondenceRecipientForm(req, res, {
        errorSummaries: recipientErrors,
        correspondenceRecipient,
        personName,
        organisationName,
      });
    } else {
      const selection = this.#getCorrespondenceRecipientSelection(
        correspondenceRecipient,
      );
      if (selection === null) {
        this.renderCorrespondenceRecipientForm(req, res, {
          errorSummaries: recipientErrors,
          correspondenceRecipient: "",
          personName,
          organisationName,
        });
      } else {
        const checkProceedings = (
          proceedings: Proceeding[] | undefined | null,
        ): boolean => proceedings !== undefined && proceedings !== null;
        const redirectUrl = checkProceedings(req.session.selectedProceedings)
          ? "/apply/proceedings/confirmation"
          : "/apply/proceedings";
        req.session.clientCorrespondenceRecipient =
          this.#buildClientCorrespondenceRecipient(
            selection,
            personName,
            organisationName,
          );
        res.redirect(redirectUrl);
      }
    }
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
      res.redirect("/apply/client-details/home-address");
    }
  }

  #getClientHomeAddress(req: Request): Address | null {
    const { session } = req;
    const { clientHomeAddress } = session;
    return this.#isClientHomeAddress(clientHomeAddress)
      ? clientHomeAddress
      : null;
  }

  #getClientCorrespondenceAddress(req: Request): Address | null {
    const { session } = req;
    const { clientCorrespondenceAddress } = session;
    return this.#isClientHomeAddress(clientCorrespondenceAddress)
      ? clientCorrespondenceAddress
      : null;
  }

  #isClientHomeAddress(value: unknown): value is Address {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    const candidate = value as Partial<Address>;
    return (
      typeof candidate.addressLine1 === "string" &&
      typeof candidate.townOrCity === "string" &&
      typeof candidate.postcode === "string"
    );
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

  #getClientCorrespondenceRecipient(req: {
    session: Request["session"];
  }): CorrespondenceRecipient | null {
    const { session } = req;
    return this.#isClientCorrespondenceRecipient(
      session.clientCorrespondenceRecipient,
    )
      ? session.clientCorrespondenceRecipient
      : null;
  }

  #isClientCorrespondenceRecipient(
    value: unknown,
  ): value is CorrespondenceRecipient {
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

  #isCorrespondenceRecipientSelection(
    value: unknown,
  ): value is CorrespondenceRecipientSelectionValue {
    return (
      value === CORRESPONDENCE_RECIPIENT_TYPE.PERSON ||
      value === CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION ||
      value === "NONE"
    );
  }

  #getCorrespondenceRecipientSelection(
    value: unknown,
  ): CorrespondenceRecipientSelectionValue | null {
    return this.#isCorrespondenceRecipientSelection(value) ? value : null;
  }

  #buildClientCorrespondenceRecipient(
    selection: CorrespondenceRecipientSelectionValue,
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

    return new CorrespondenceRecipient(selection, recipientName ?? "");
  }

  #isClientNoFixedAbode(req: { session: Request["session"] }): boolean {
    return req.session.clientHasNoFixedAbode === true;
  }
}
