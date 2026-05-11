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
        clientDob: req.session.clientDobDay && req.session.clientDobMonth && req.session.clientDobYear ? `${req.session.clientDobDay}/${req.session.clientDobMonth}/${req.session.clientDobYear}` : "" 
      },
      deceasedDetails: {
        deceasedFirstName: req.session.deceasedFirstName ?? "",
        deceasedLastName: req.session.deceasedLastName ?? "",
        dateOfDeath: req.session.deceasedDateOfDeathDay && req.session.deceasedDateOfDeathMonth && req.session.deceasedDateOfDeathYear ? `${req.session.deceasedDateOfDeathDay}/${req.session.deceasedDateOfDeathMonth}/${req.session.deceasedDateOfDeathYear}` : ""
      }
    });
  }
}
