import type { Request, Response } from "express";
import type { Formatter } from "#src/utils/Formatter.js";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import {
  SubmitApplicationRequestSchema,
  SubmitApplicationResponseSchema,
} from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.js";
import type {
  ClientCorrespondenceRecipient,
  ClientHomeAddress,
  Proceeding,
} from "#src/infrastructure/express/session/index.types.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";
import {
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
  CLIENT_DECLARATION_ERROR,
  HTTP_CREATED,
} from "#src/infrastructure/locales/constants.js";
import type { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";
import type {
  ClientDeclarationError,
  ClientDeclarationFormData,
} from "#src/adaptors/presenters/apply/models/form.types.js";

export class ConfirmationAdaptor {
  formatter: Formatter;
  applySubmitPort: ApplySubmitPort;
  sessionHelper: SessionHelper;

  constructor(
    formatter: Formatter,
    applySubmitPort: ApplySubmitPort,
    sessionHelper: SessionHelper,
  ) {
    this.formatter = formatter;
    this.applySubmitPort = applySubmitPort;
    this.sessionHelper = sessionHelper;
  }

  renderCheckYourAnswers(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const publicAuthorities = this.formatter.formatIntoTableRows(
      req.session.selectedPublicAuthorities ?? [],
    );

    const clientDob = this.#createDateString(
      req.session.clientDobDay as string,
      req.session.clientDobMonth as string,
      req.session.clientDobYear as string,
    );
    const dateOfDeath = this.#createDateString(
      req.session.deceasedDateOfDeathDay as string,
      req.session.deceasedDateOfDeathMonth as string,
      req.session.deceasedDateOfDeathYear as string,
    );

    const clientAddress = this.#getClientAddressSummary(req);
    const clientPostcode = this.#getClientPostcodeSummary(req);
    const clientCorrespondenceAddress =
      this.#getClientCorrespondenceAddressSummary(req);
    const clientCorrespondenceRecipient =
      this.#getClientCorrespondenceRecipientSummary(req);

    res.render("apply/check-your-answers", {
      csrfToken,
      client: {
        clientFirstName: req.session.clientFirstName ?? "",
        clientLastName: req.session.clientLastName ?? "",
        clientDob,
        clientAddress: `${clientAddress} ${clientPostcode}`,
        clientCorrespondenceAddress,
        clientCorrespondenceRecipient,
      },
      deceasedDetails: {
        deceasedFirstName: req.session.deceasedFirstName ?? "",
        deceasedLastName: req.session.deceasedLastName ?? "",
        dateOfDeath,
        deceasedClientRelationship:
          req.session.deceasedClientRelationship ?? "",
        deceasedCoronerReference: req.session.deceasedCoronerReference ?? "",
      },
      publicAuthorities,
    });
  }

  renderClientDeclarationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/submit/client-declaration", {
      csrfToken,
      clientDetails: {
        firstName: req.session.clientFirstName ?? "",
        lastName: req.session.clientLastName ?? "",
      },
    });
  }

  async processClientDeclarationForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { "client-declaration-confirmation": declarationConfirmation } =
      req.body as ClientDeclarationFormData;
    const hasConfirmedDeclaration =
      declarationConfirmation === "true" ||
      (Array.isArray(declarationConfirmation) &&
        declarationConfirmation.includes("true"));

    if (!hasConfirmedDeclaration) {
      const {
        locals: { csrfToken },
      } = res;

      const errorSummaries: ClientDeclarationError = {
        noDeclarationConfirmation: {
          text: CLIENT_DECLARATION_ERROR.NO_CONFIRMATION,
        },
      };

      res.render("apply/submit/client-declaration", {
        csrfToken,
        clientDetails: {
          firstName: req.session.clientFirstName ?? "",
          lastName: req.session.clientLastName ?? "",
        },
        errorSummaries,
      });
      return;
    }

    const submitBody = this.#generateSubmitBody(req);
    const { session } = req;
    const responseRaw =
      await this.applySubmitPort.submitApplication(submitBody);
    const { statusCode, laaReference } =
      SubmitApplicationResponseSchema.parse(responseRaw);

    if (statusCode === HTTP_CREATED) {
      this.sessionHelper.clearApplyFormData(req);
      session.applicationReferenceNumber = laaReference.toString();
      res.redirect("/apply/confirmation/success");
    }
  }

  #generateSubmitBody(req: Request): SubmitApplicationRequest {
    const client = this.#buildClientForSubmit(req);
    this.#applyOptionalClientFields(client, req);
    this.#applyClientAddressesForSubmit(client, req);
    this.#applyClientCorrespondenceRecipientForSubmit(client, req);

    const submitBodyWithDetails = {
      client,
      deceased: this.#buildDeceasedForSubmit(req),
      proceedings: this.#buildProceedingsForSubmit(req),
      publicBodies: this.#buildPublicBodiesForSubmit(req),
    };

    const submitBody = SubmitApplicationRequestSchema.parse(
      submitBodyWithDetails,
    );
    return submitBody;
  }

  #applyOptionalClientFields(
    client: SubmitApplicationRequest["client"],
    req: Request,
  ): void {
    const { session } = req;
    const { clientLastNameAtBirth, clientNino } = session;

    if (typeof clientLastNameAtBirth === "string") {
      client.clientLastNameAtBirth = clientLastNameAtBirth;
    }

    if (typeof clientNino === "string") {
      client.nationalInsuranceNumber = clientNino;
    }
  }

  #applyClientAddressesForSubmit(
    client: SubmitApplicationRequest["client"],
    req: Request,
  ): void {
    const hasNoFixedAbode = this.#isClientNoFixedAbode(req);
    client.hasNoFixedAbode = hasNoFixedAbode;

    const correspondenceAddressSource =
      this.#getClientCorrespondenceAddressSource(req);
    client.correspondenceAddressSource = correspondenceAddressSource;

    const clientCorrespondenceAddress =
      this.#getClientCorrespondenceAddress(req);
    if (
      correspondenceAddressSource ===
        CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS &&
      clientCorrespondenceAddress !== null
    ) {
      client.correspondenceAddress = {
        addressLine1: clientCorrespondenceAddress.addressLine1,
        addressLine2: clientCorrespondenceAddress.addressLine2 ?? null,
        townOrCity: clientCorrespondenceAddress.townOrCity,
        county: clientCorrespondenceAddress.county ?? null,
        postcode: clientCorrespondenceAddress.postcode,
      };
    }

    const clientHomeAddress = this.#getClientHomeAddress(req);
    if (!hasNoFixedAbode && clientHomeAddress !== null) {
      client.homeAddress = {
        addressLine1: clientHomeAddress.addressLine1,
        addressLine2: clientHomeAddress.addressLine2 ?? null,
        townOrCity: clientHomeAddress.townOrCity,
        county: clientHomeAddress.county ?? null,
        postcode: clientHomeAddress.postcode,
      };
    }
  }

  #applyClientCorrespondenceRecipientForSubmit(
    client: SubmitApplicationRequest["client"],
    req: Request,
  ): void {
    const clientCorrespondenceRecipient =
      this.#getClientCorrespondenceRecipient(req);

    client.isClientCorrespondenceRecipient =
      clientCorrespondenceRecipient === null;

    if (clientCorrespondenceRecipient === null) {
      delete client.correspondenceRecipient;
    } else {
      client.correspondenceRecipient = {
        recipientType: clientCorrespondenceRecipient.recipientType,
        recipientName: clientCorrespondenceRecipient.recipientName,
      };
    }
  }

  renderConfirmSuccess(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const applicationReferenceNumber =
      typeof req.session.applicationReferenceNumber === "string"
        ? req.session.applicationReferenceNumber
        : "";

    res.render("apply/confirm-success", {
      csrfToken,
      applicationReferenceNumber,
    });
    this.sessionHelper.clearApplyFormData(req);
  }

  #createDateString(day?: string, month?: string, year?: string): string {
    return typeof day === "string" &&
      typeof month === "string" &&
      typeof year === "string"
      ? `${day}/${month}/${year}`
      : "";
  }

  #createAddressString(
    addressLine1?: string,
    addressLine2?: string,
    townOrCity?: string,
    county?: string,
  ): string {
    return `${addressLine1 ?? ""}${addressLine2 ?? " "} ${townOrCity ?? ""} ${county ?? ""}`;
  }

  #getClientAddressSummary(req: Request): string {
    if (this.#isClientNoFixedAbode(req)) {
      return "No fixed abode";
    }

    const clientHomeAddress = this.#getClientHomeAddress(req);
    if (clientHomeAddress === null) {
      return this.#createAddressString(
        req.session.clientAddressLine1 as string,
        req.session.clientAddressLine2 as string,
        req.session.clientTownOrCity as string,
        req.session.clientCounty as string,
      );
    }

    return this.#createAddressString(
      clientHomeAddress.addressLine1,
      clientHomeAddress.addressLine2 ?? undefined,
      clientHomeAddress.townOrCity,
      clientHomeAddress.county ?? undefined,
    );
  }

  #getClientPostcodeSummary(req: Request): string {
    if (this.#isClientNoFixedAbode(req)) {
      return "";
    }

    const clientHomeAddress = this.#getClientHomeAddress(req);
    if (clientHomeAddress === null) {
      return typeof req.session.clientPostcode === "string"
        ? req.session.clientPostcode
        : "";
    }

    return clientHomeAddress.postcode;
  }

  #buildClientForSubmit(req: Request): SubmitApplicationRequest["client"] {
    return {
      clientFirstName: req.session.clientFirstName as string,
      clientLastName: req.session.clientLastName as string,
      dateOfBirth: formatDateDDMMYYYY(
        req.session.clientDobYear,
        req.session.clientDobMonth,
        req.session.clientDobDay,
      ),
      hasNoFixedAbode: false,
      correspondenceAddressSource:
        CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS,
      homeAddress: null,
      correspondenceAddress: null,
      isClientCorrespondenceRecipient: true,
    };
  }

  #getClientCorrespondenceAddressSummary(req: Request): string {
    const source = this.#getClientCorrespondenceAddressSource(req);

    if (source === CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS) {
      return "Same as client's home address";
    }

    if (source === CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS) {
      return "My office address";
    }

    const correspondenceAddress = this.#getClientCorrespondenceAddress(req);
    if (correspondenceAddress === null) {
      return "";
    }

    const addressString = this.#createAddressString(
      correspondenceAddress.addressLine1,
      correspondenceAddress.addressLine2 ?? undefined,
      correspondenceAddress.townOrCity,
      correspondenceAddress.county ?? undefined,
    );

    return `${addressString} ${correspondenceAddress.postcode}`.trim();
  }

  #buildDeceasedForSubmit(req: Request): SubmitApplicationRequest["deceased"] {
    return {
      deceasedFirstName: req.session.deceasedFirstName as string,
      deceasedLastName: req.session.deceasedLastName as string,
      deceasedDateOfBirth: formatDateDDMMYYYY(
        req.session.deceasedDateOfBirthYear,
        req.session.deceasedDateOfBirthMonth,
        req.session.deceasedDateOfBirthDay,
      ),
      deceasedDateOfDeath: formatDateDDMMYYYY(
        req.session.deceasedDateOfDeathYear,
        req.session.deceasedDateOfDeathMonth,
        req.session.deceasedDateOfDeathDay,
      ),
      coronersReference: (req.session.deceasedCoronerReference ?? "") as string,
      furtherInformation: (req.session.deceasedFurtherInformation ??
        "") as string,
      clientRelationshipToDeceased: (req.session.deceasedClientRelationship ??
        "") as string,
    };
  }

  #buildProceedingsForSubmit(
    req: Request,
  ): SubmitApplicationRequest["proceedings"] {
    const selectedProceedings = req.session.selectedProceedings ?? [];
    return selectedProceedings.map((proceeding: Proceeding) => ({
      proceedingId: proceeding.proceedingId,
    }));
  }

  #buildPublicBodiesForSubmit(
    req: Request,
  ): SubmitApplicationRequest["publicBodies"] {
    return (
      req.session.selectedPublicAuthorities?.map((body) => ({
        publicBodyId: body.publicAuthorityDescription,
      })) ?? []
    );
  }

  #getClientCorrespondenceRecipientSummary(req: Request): string {
    const correspondenceRecipient = this.#getClientCorrespondenceRecipient(req);
    return (
      correspondenceRecipient?.recipientName ??
      "Correspondence will be addressed to the client"
    );
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

  #getClientCorrespondenceRecipient(
    req: Request,
  ): ClientCorrespondenceRecipient | null {
    const { session } = req;
    const { clientCorrespondenceRecipient } = session;
    return this.#isClientCorrespondenceRecipient(clientCorrespondenceRecipient)
      ? clientCorrespondenceRecipient
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

  #isClientCorrespondenceRecipient(
    value: unknown,
  ): value is ClientCorrespondenceRecipient {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const candidate = value as Partial<ClientCorrespondenceRecipient>;
    return (
      (candidate.recipientType === CORRESPONDENCE_RECIPIENT_TYPE.PERSON ||
        candidate.recipientType ===
          CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION) &&
      typeof candidate.recipientName === "string"
    );
  }

  #isClientNoFixedAbode(req: Request): boolean {
    return req.session.clientHasNoFixedAbode === true;
  }

  #getClientCorrespondenceAddressSource(
    req: Request,
  ): SubmitApplicationRequest["client"]["correspondenceAddressSource"] {
    const {
      session: { clientCorrespondenceAddressSource },
    } = req;

    if (
      clientCorrespondenceAddressSource ===
      CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS
    ) {
      return CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS;
    }

    if (
      clientCorrespondenceAddressSource ===
      CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS
    ) {
      return CORRESPONDENCE_ADDRESS_SOURCE.USE_SPECIFIED_ADDRESS;
    }

    return CORRESPONDENCE_ADDRESS_SOURCE.USE_PROVIDER_ADDRESS;
  }
}
