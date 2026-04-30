import type { Request, Response } from "express"

export class ClientDetailsAdaptor {
  renderNameForm(req : Request, res : Response):void {
    const { csrfToken } = res.locals;
    res.render("apply/client-details/name-and-dob", { csrfToken });
  }

  processNameForm(req : Request, res : Response):void {
    req.session.clientFirstName = req.body["first-name"]
    req.session.clientLastName = req.body["last-name"]
    req.session.clientLastNameAtBirth = req.body["last-name-at-birth"]
    res.redirect("/apply/client-details/nino");
  }

  renderNinoForm(req : Request, res : Response):void {
    const { csrfToken } = res.locals;
    res.render("apply/client-details/nino", { csrfToken });
  }

  processNinoForm(req : Request, res : Response):void {
    req.session.clientNino = req.body["has-nino"] === "true" ? req.body["nino-input"] : null
    res.redirect("/apply/client-details/has-prev-application");
  }

  renderHasPrevApplicationForm(req : Request, res : Response):void {
    const { csrfToken } = res.locals;
    res.render("apply/client-details/has-prev-application", { csrfToken });
  }

  processHasPrevApplicationForm(req : Request, res : Response):void {
    const hasPrevApplication = req.body["has-prev-application"] === "true"
    req.session.clientHasPrevApplication = hasPrevApplication
    req.session.prevLaaReferenceInput = hasPrevApplication ? req.body["prev-laa-reference-input"] : null
    res.redirect("/apply/proceedings");
  }
}