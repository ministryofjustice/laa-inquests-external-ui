import type { Request, Response } from "express";
import type { Formatter } from "#src/utils/Formatter.js";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import {
  SubmitApplicationRequestSchema,
  SubmitApplicationResponseSchema,
} from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";
import type { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";

export class ConfirmationAdaptor {
  formatter: Formatter;
  applySubmitPort: ApplySubmitPort;

  constructor(formatter: Formatter, applySubmitPort: ApplySubmitPort) {
    this.formatter = formatter;
    this.applySubmitPort = applySubmitPort;
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

    const clientAddress = this.#createAddressString(
      req.session.clientAddressLine1 as string,
      req.session.clientAddressLine2 as string,
      req.session.clientTownOrcity as string,
      req.session.clientCounty as string,
    );
    const clientCorrespondenceAddress = this.#createAddressString(
      req.session.clientCorrespondenceAddressLine1 as string,
      req.session.clientCorrespondenceAddressLine2 as string,
      req.session.clientCorrespondenceTownOrcity as string,
      req.session.clientCorrespondenceCounty as string,
    );

    const clientPostcode =
      typeof req.session.clientPostcode === "string"
        ? req.session.clientPostcode
        : "";
    const clientCorrespondencePostcode =
      typeof req.session.clientCorrespondencePostcode === "string"
        ? req.session.clientCorrespondencePostcode
        : "";

    res.render("apply/check-your-answers", {
      csrfToken,
      client: {
        clientFirstName: req.session.clientFirstName ?? "",
        clientLastName: req.session.clientLastName ?? "",
        clientDob,
        clientAddress: `${clientAddress} ${clientPostcode}`,
        clientCorrespondenceAddress: `${clientCorrespondenceAddress} ${clientCorrespondencePostcode}`,
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
    const submitBody = this.#generateSubmitBody(req);
    const { session } = req;
    const responseRaw =
      await this.applySubmitPort.submitApplication(submitBody);
    const { statusCode, laaReference } =
      SubmitApplicationResponseSchema.parse(responseRaw);

    if (statusCode === HTTP_CREATED) {
      session.applicationReferenceNumber = laaReference.toString();
      res.redirect("/apply/confirmation/success");
    }
  }

  #generateSubmitBody(req: Request): SubmitApplicationRequest {
    const { session } = req;
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const publicBodies =
      req.session.selectedPublicAuthorities?.map((body) => ({
        publicBodyId: body.publicAuthorityDescription,
      })) ?? [];
    const { clientLastNameAtBirth, clientNino } = session;

    const client: SubmitApplicationRequest["client"] = {
      clientFirstName: req.session.clientFirstName as string,
      clientLastName: req.session.clientLastName as string,
      dateOfBirth: formatDateDDMMYYYY(
        req.session.clientDobYear,
        req.session.clientDobMonth,
        req.session.clientDobDay,
      ),
    };

    if (typeof clientLastNameAtBirth === "string") {
      client.clientLastNameAtBirth = clientLastNameAtBirth;
    }

    if (typeof clientNino === "string") {
      client.nationalInsuranceNumber = clientNino;
    }

    // Build the payload
    const submitBodyRaw = {
      client,
      deceased: {
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
        coronersReference: (req.session.deceasedCoronerReference ??
          "") as string,
        furtherInformation: (req.session.deceasedFurtherInformation ??
          "") as string,
        clientRelationshipToDeceased: (req.session.deceasedClientRelationship ??
          "") as string,
      },
      proceedings: selectedProceedings.map((proceeding: Proceeding) => ({
        proceedingId: proceeding.proceedingId,
      })),
      publicBodies,
    };

    // Validate and parse with Zod
    const submitBody = SubmitApplicationRequestSchema.parse(submitBodyRaw);
    return submitBody;
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
}
