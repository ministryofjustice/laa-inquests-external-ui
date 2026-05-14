import type { Request, Response } from "express";
import type { Formatter } from "#src/utils/Formatter.js";

export class ConfirmationAdaptor {
  formatter: Formatter;
  constructor(formatter: Formatter) {
    this.formatter = formatter;
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
