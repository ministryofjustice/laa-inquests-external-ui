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

    const publicAuthorities = this.formatter.formatIntoTableRows(req.session.selectedPublicAuthorities ?? []);
    
    const clientDob = this.createDateString(req.session.clientDobDay as string, req.session.clientDobMonth as string, req.session.clientDobYear as string);
    const dateOfDeath = this.createDateString(req.session.deceasedDateOfDeathDay as string, req.session.deceasedDateOfDeathMonth as string, req.session.deceasedDateOfDeathYear as string);

    const clientAddress = this.createAddressString(req.session.clientAddressLine1 as string, req.session.clientAddressLine2 as string, req.session.clientTownOrcity as string, req.session.clientCounty as string, req.session.clientPostcode as string);
    const clientCorrespondenceAddress = this.createAddressString(req.session.clientCorrespondenceAddressLine1 as string, req.session.clientCorrespondenceAddressLine2 as string, req.session.clientCorrespondenceTownOrcity as string, req.session.clientCorrespondenceCounty as string, req.session.clientCorrespondencePostcode as string);

    res.render("apply/check-your-answers", {
      csrfToken,
      client: {
        clientFirstName: req.session.clientFirstName ?? "",
        clientLastName: req.session.clientLastName ?? "",
        clientDob: clientDob,
        clientAddress: clientAddress,
        clientCorrespondenceAddress: clientCorrespondenceAddress
      },
      deceasedDetails: {
        deceasedFirstName: req.session.deceasedFirstName ?? "",
        deceasedLastName: req.session.deceasedLastName ?? "",
        dateOfDeath: dateOfDeath,
        deceasedClientRelationship: req.session.deceasedClientRelationship ?? "",
        deceasedCoronerReference: req.session.deceasedCoronerReference ?? ""
      },
      publicAuthorities
    });
  }

  createDateString(day?: string, month?: string, year?: string): string{
    return (typeof day === 'string' && typeof month === 'string' && typeof year === 'string') ? `${day}/${month}/${year}` : "";
  }

  createAddressString(addressLine1?: string, addressLine2?: string, townOrcity?: string, county?: string, postcode?: string): string{
    return `${addressLine1 ?? ""}${addressLine2 ?? " "} ${townOrcity ?? ""} ${county ?? ""} ${postcode ?? ""}`;
  }

}
