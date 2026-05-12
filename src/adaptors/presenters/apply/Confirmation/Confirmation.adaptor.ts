import type { Request, Response } from "express";

export class ConfirmationAdaptor {

  renderCheckYourAnswers(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/check-your-answers", {
      csrfToken,
      client: {
        clientFirstName: req.session.clientFirstName ?? "",
        clientLastName: req.session.clientLastName ?? "",
        clientDob: req.session.clientDobDay && req.session.clientDobMonth && req.session.clientDobYear ? `${req.session.clientDobDay}/${req.session.clientDobMonth}/${req.session.clientDobYear}` : "", 
        clientAddress: `${req.session.clientAddressLine1 ?? ""}${req.session.clientAddressLine2 ?? " "} ${req.session.clientTownOrcity ?? ""} ${req.session.clientCounty ?? ""} ${req.session.clientPostcode ?? ""}`,
        clientCorrespondenceAddress : `${req.session.clientCorrespondenceAddressLine1 ?? ""}${req.session.clientCorrespondenceAddressLine2 ?? " "} ${req.session.clientCorrespondenceTownOrcity ?? ""} ${req.session.clientCorrespondenceCounty ?? ""} ${req.session.clientCorrespondencePostcode ?? ""}`,
      },
      deceasedDetails: {
        deceasedFirstName: req.session.deceasedFirstName ?? "",
        deceasedLastName: req.session.deceasedLastName ?? "",
        dateOfDeath: req.session.deceasedDateOfDeathDay && req.session.deceasedDateOfDeathMonth && req.session.deceasedDateOfDeathYear ? `${req.session.deceasedDateOfDeathDay}/${req.session.deceasedDateOfDeathMonth}/${req.session.deceasedDateOfDeathYear}` : "",
        deceasedClientRelationship: req.session.deceasedClientRelationship ?? "",
        deceasedCoronerReference: req.session.deceasedCoronerReference ?? ""
      }
    });
  }
}
