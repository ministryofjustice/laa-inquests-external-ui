/* eslint-disable max-lines -- This adaptor orchestrates the full multi-page client-details journey. */
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Request, Response } from "express";
import type {
  ClientDetailsFormData,
  CorrespondenceAddressSourceValue,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import {
  CORRESPONDENCE_RECIPIENT_TYPE,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { ClientDetailsValidator } from "./ClientDetails.validator.js";
import { ClientDetailsFormatter } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.js";
import type { Address } from "#src/domain/Client/Address.js";
import type { CorrespondenceRecipient } from "#src/domain/Client/CorrespondenceRecipient.js";
import { UpdateCorrespondenceRecipientUseCase } from "#src/use-cases/apply/clientDetails/UpdateCorrespondenceRecipient.useCase.js";
import { ProcessClientDetailsJourneyUseCase } from "#src/use-cases/apply/clientDetails/ProcessClientDetailsJourney.useCase.js";
import { getStringValue } from "#src/utils/sessionValue.js";

interface ClientDetailsUseCases {
  updateCorrespondenceRecipient: UpdateCorrespondenceRecipientUseCase;
  processClientDetailsJourney: ProcessClientDetailsJourneyUseCase;
}

export class ClientDetailsAdaptor {
  formValidator: ClientDetailsValidator;
  formatter: ClientDetailsFormatter;
  updateCorrespondenceRecipientUseCase: UpdateCorrespondenceRecipientUseCase;
  processClientDetailsJourneyUseCase: ProcessClientDetailsJourneyUseCase;

  constructor(
    formValidator: ClientDetailsValidator,
    formatter: ClientDetailsFormatter = new ClientDetailsFormatter(),
    useCases?: Partial<ClientDetailsUseCases>,
  ) {
    const resolvedUseCases = this.#resolveUseCases(formValidator, useCases);
    const { updateCorrespondenceRecipient, processClientDetailsJourney } =
      resolvedUseCases;

    this.formValidator = formValidator;
    this.formatter = formatter;
    this.updateCorrespondenceRecipientUseCase = updateCorrespondenceRecipient;
    this.processClientDetailsJourneyUseCase = processClientDetailsJourney;
  }

  #resolveUseCases(
    formValidator: ClientDetailsValidator,
    useCases?: Partial<ClientDetailsUseCases>,
  ): ClientDetailsUseCases {
    const defaultUseCases: ClientDetailsUseCases = {
      updateCorrespondenceRecipient: new UpdateCorrespondenceRecipientUseCase(),
      processClientDetailsJourney: new ProcessClientDetailsJourneyUseCase(
        formValidator,
      ),
    };

    if (useCases === undefined) {
      return defaultUseCases;
    }

    return {
      ...defaultUseCases,
      ...useCases,
    };
  }

  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const nameDobView = this.#buildClientNameDobView({
      clientFirstName: getStringValue(req.session.clientFirstName),
      clientLastName: getStringValue(req.session.clientLastName),
      clientLastNameAtBirth: getStringValue(req.session.clientLastNameAtBirth),
      hasNameChanged: getStringValue(req.session.hasNameChanged),
      clientDobDay: getStringValue(req.session.clientDobDay),
      clientDobMonth: getStringValue(req.session.clientDobMonth),
      clientDobYear: getStringValue(req.session.clientDobYear),
    });

    res.render("apply/client-details/name-and-dob", {
      csrfToken,
      client: nameDobView.client,
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

    const { errorSummaries } = this.processClientDetailsJourneyUseCase.execute({
      step: "NAME_DOB",
      formBody: req.body,
    });

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      const nameDobView = this.#buildClientNameDobView({
        clientFirstName: getStringValue(req.session.clientFirstName),
        clientLastName: getStringValue(req.session.clientLastName),
        clientLastNameAtBirth: getStringValue(
          req.session.clientLastNameAtBirth,
        ),
        hasNameChanged: getStringValue(req.session.hasNameChanged),
        clientDobDay: getStringValue(req.session.clientDobDay),
        clientDobMonth: getStringValue(req.session.clientDobMonth),
        clientDobYear: getStringValue(req.session.clientDobYear),
      });

      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorSummaries,
        client: nameDobView.client,
      });
    } else {
      res.redirect("/apply/client-details/nino");
    }
  }

  renderNinoForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/nino", {
      csrfToken,
      client: {
        hasNino: req.session.clientHasNino,
        clientNino: req.session.clientNino,
      },
    });
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

    const { errorSummaries: ninoErrors } =
      this.processClientDetailsJourneyUseCase.execute({
        step: "NINO",
        formBody: req.body,
      });
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

    const homeAddressView = this.#buildClientHomeAddressView({
      clientHomeAddress: this.#getClientHomeAddress(req),
      clientHasNoFixedAbode: this.#isClientNoFixedAbode(req),
    });
    const homeAddressClient = {
      ...this.formatter.toHomeAddressViewModel(
        homeAddressView.clientHomeAddress,
      ),
      hasNoFixedAbode: homeAddressView.clientHasNoFixedAbode,
    };

    res.render("apply/client-details/home-address", {
      csrfToken,
      client: homeAddressClient,
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

    const { errorSummaries: homeAddressErrors } =
      this.processClientDetailsJourneyUseCase.execute({
        step: "HOME_ADDRESS",
        formBody: req.body,
      });
    const homeAddressView = this.#buildClientHomeAddressView({
      clientHomeAddress: homeAddress,
      clientHasNoFixedAbode: false,
    });
    const homeAddressClient = {
      ...this.formatter.toHomeAddressViewModel(
        homeAddressView.clientHomeAddress,
      ),
      hasNoFixedAbode: homeAddressView.clientHasNoFixedAbode,
    };

    if (Object.keys(homeAddressErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/client-details/home-address", {
        csrfToken,
        errorSummaries: homeAddressErrors,
        client: homeAddressClient,
      });
    } else {
      res.redirect("/apply/client-details/correspondence-address-source");
    }
  }

  renderCorrespondenceAddressSourceForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const correspondenceAddressSourceView =
      this.#buildCorrespondenceAddressSourceView({
        clientCorrespondenceAddressSource:
          this.#getClientCorrespondenceAddressSource(req) ?? undefined,
      });

    res.render("apply/client-details/correspondence-address-source", {
      csrfToken,
      client: correspondenceAddressSourceView.client,
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

    const { errorSummaries: sourceErrors } =
      this.processClientDetailsJourneyUseCase.execute({
        step: "CORRESPONDENCE_ADDRESS_SOURCE",
        formBody: req.body,
        hasNoFixedAbode: this.#isClientNoFixedAbode(req),
      });

    if (Object.keys(sourceErrors).length > EMPTY_ARR_LENGTH) {
      const correspondenceAddressSourceView =
        this.#buildCorrespondenceAddressSourceView({
          clientCorrespondenceAddressSource:
            this.#isCorrespondenceAddressSource(correspondenceAddressSource)
              ? correspondenceAddressSource
              : undefined,
        });

      res.render("apply/client-details/correspondence-address-source", {
        csrfToken,
        errorSummaries: sourceErrors,
        client: correspondenceAddressSourceView.client,
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
      const correspondenceAddressSourceView =
        this.#buildCorrespondenceAddressSourceView({
          clientCorrespondenceAddressSource: undefined,
        });

      res.render("apply/client-details/correspondence-address-source", {
        csrfToken,
        errorSummaries: sourceErrors,
        client: correspondenceAddressSourceView.client,
      });
    }
  }

  renderCorrespondenceAddressForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const correspondenceAddressView = this.#buildCorrespondenceAddressView({
      clientCorrespondenceAddress: this.#getClientCorrespondenceAddress(req),
    });

    res.render("apply/client-details/correspondence-address", {
      csrfToken,
      client: this.formatter.toCorrespondenceAddressViewModel(
        correspondenceAddressView.clientCorrespondenceAddress,
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
    const { errorSummaries: correspondenceAddressErrors } =
      this.processClientDetailsJourneyUseCase.execute({
        step: "CORRESPONDENCE_ADDRESS",
        formBody: req.body,
      });

    if (Object.keys(correspondenceAddressErrors).length > EMPTY_ARR_LENGTH) {
      const correspondenceAddressView = this.#buildCorrespondenceAddressView({
        clientCorrespondenceAddress: correspondenceAddress,
      });

      res.render("apply/client-details/correspondence-address", {
        csrfToken,
        errorSummaries: correspondenceAddressErrors,
        client: this.formatter.toCorrespondenceAddressViewModel(
          correspondenceAddressView.clientCorrespondenceAddress,
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
    const correspondenceRecipientView = this.#buildCorrespondenceRecipientView(
      {
        clientCorrespondenceRecipient:
          this.#getClientCorrespondenceRecipientState(req),
      },
      recipient,
      {
        correspondenceRecipient: params?.correspondenceRecipient,
        personName: params?.personName,
        organisationName: params?.organisationName,
      },
    );

    const correspondenceRecipientClient =
      this.formatter.buildCorrespondenceRecipientViewModel(
        {
          session: {
            clientCorrespondenceRecipient:
              correspondenceRecipientView.clientCorrespondenceRecipient,
          },
        },
        correspondenceRecipientView.recipient,
        correspondenceRecipientView.params,
      );

    res.render("apply/client-details/correspondence-recipient", {
      csrfToken,
      errorSummaries: params?.errorSummaries,
      client: correspondenceRecipientClient,
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

    const { errorSummaries: recipientErrors } =
      this.processClientDetailsJourneyUseCase.execute({
        step: "CORRESPONDENCE_RECIPIENT",
        formBody: req.body,
      });

    if (Object.keys(recipientErrors).length > EMPTY_ARR_LENGTH) {
      this.renderCorrespondenceRecipientForm(req, res, {
        errorSummaries: recipientErrors,
        correspondenceRecipient,
        personName,
        organisationName,
      });
      return;
    }

    const updatedRecipientResult =
      this.updateCorrespondenceRecipientUseCase.execute(
        correspondenceRecipient,
        personName,
        organisationName,
      );

    if (
      updatedRecipientResult.status !== "SUCCESS" ||
      updatedRecipientResult.data === undefined
    ) {
      this.renderCorrespondenceRecipientForm(req, res, {
        errorSummaries: recipientErrors,
        correspondenceRecipient: "",
        personName,
        organisationName,
      });
      return;
    }

    const checkProceedings = (
      proceedings: Proceeding[] | undefined | null,
    ): boolean => proceedings !== undefined && proceedings !== null;
    const redirectUrl = checkProceedings(req.session.selectedProceedings)
      ? "/apply/proceedings/confirmation"
      : "/apply/proceedings";

    const { data } = updatedRecipientResult;
    const { clientCorrespondenceRecipient } = data;
    req.session.clientCorrespondenceRecipient = clientCorrespondenceRecipient;
    res.redirect(redirectUrl);
  }

  renderHasPrevApplicationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    res.render("apply/client-details/has-prev-application", {
      csrfToken,
      client: {
        hasPrevApplication: req.session.clientHasPrevApplication,
        prevLaaReference: req.session.prevLaaReferenceInput,
      },
    });
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

    const { errorSummaries: prevApplicationRefErrors } =
      this.processClientDetailsJourneyUseCase.execute({
        step: "PREV_APPLICATION_REFERENCE",
        formBody: req.body,
      });

    if (Object.keys(prevApplicationRefErrors).length > EMPTY_ARR_LENGTH) {
      const previousApplicationView = this.#buildPreviousApplicationView({
        clientHasPrevApplication: getStringValue(
          req.session.clientHasPrevApplication,
        ),
        prevLaaReferenceInput: getStringValue(
          req.session.prevLaaReferenceInput,
        ),
      });

      res.render("apply/client-details/has-prev-application", {
        csrfToken,
        errorSummaries: prevApplicationRefErrors,
        client: previousApplicationView.client,
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

  #getClientCorrespondenceRecipientState(req: {
    session: Request["session"];
  }): CorrespondenceRecipient | null | undefined {
    const { session } = req;
    const { clientCorrespondenceRecipient } = session;

    if (clientCorrespondenceRecipient === null) {
      return null;
    }

    return this.#isClientCorrespondenceRecipient(clientCorrespondenceRecipient)
      ? clientCorrespondenceRecipient
      : undefined;
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

  #isClientNoFixedAbode(req: { session: Request["session"] }): boolean {
    return req.session.clientHasNoFixedAbode === true;
  }

  #buildClientNameDobView(state: {
    clientFirstName?: string;
    clientLastName?: string;
    clientLastNameAtBirth?: string;
    hasNameChanged?: string;
    clientDobDay?: string;
    clientDobMonth?: string;
    clientDobYear?: string;
  }): {
    client: {
      clientFirstName: string;
      clientLastName: string;
      clientLastNameAtBirth: string;
      hasNameChanged: string;
      clientDobDay: string;
      clientDobMonth: string;
      clientDobYear: string;
    };
  } {
    return {
      client: {
        clientFirstName: state.clientFirstName ?? "",
        clientLastName: state.clientLastName ?? "",
        clientLastNameAtBirth: state.clientLastNameAtBirth ?? "",
        hasNameChanged: state.hasNameChanged ?? "",
        clientDobDay: state.clientDobDay ?? "",
        clientDobMonth: state.clientDobMonth ?? "",
        clientDobYear: state.clientDobYear ?? "",
      },
    };
  }

  #buildClientHomeAddressView(state: {
    clientHomeAddress?: Address | null;
    clientHasNoFixedAbode?: boolean;
  }): {
    clientHomeAddress: Address | null;
    clientHasNoFixedAbode: boolean;
  } {
    return {
      clientHomeAddress: state.clientHomeAddress ?? null,
      clientHasNoFixedAbode: state.clientHasNoFixedAbode === true,
    };
  }

  #buildCorrespondenceAddressSourceView(state: {
    clientCorrespondenceAddressSource?: string;
  }): {
    client: { correspondenceAddressSource: string };
  } {
    return {
      client: {
        correspondenceAddressSource:
          state.clientCorrespondenceAddressSource ?? "",
      },
    };
  }

  #buildCorrespondenceAddressView(state: {
    clientCorrespondenceAddress?: Address | null;
  }): {
    clientCorrespondenceAddress: Address | null;
  } {
    return {
      clientCorrespondenceAddress: state.clientCorrespondenceAddress ?? null,
    };
  }

  #buildCorrespondenceRecipientView(
    state: {
      clientCorrespondenceRecipient: CorrespondenceRecipient | null | undefined;
    },
    recipient: CorrespondenceRecipient | null,
    params?: {
      correspondenceRecipient?: string;
      personName?: string;
      organisationName?: string;
    },
  ): {
    clientCorrespondenceRecipient: CorrespondenceRecipient | null | undefined;
    recipient: CorrespondenceRecipient | null;
    params?: {
      correspondenceRecipient?: string;
      personName?: string;
      organisationName?: string;
    };
  } {
    return {
      clientCorrespondenceRecipient: state.clientCorrespondenceRecipient,
      recipient,
      params,
    };
  }

  #buildPreviousApplicationView(state: {
    clientHasPrevApplication?: string;
    prevLaaReferenceInput?: string;
  }): {
    client: {
      hasPrevApplication: string;
      prevLaaReference: string;
    };
  } {
    return {
      client: {
        hasPrevApplication: state.clientHasPrevApplication ?? "",
        prevLaaReference: state.prevLaaReferenceInput ?? "",
      },
    };
  }
}
