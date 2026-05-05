import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Request, Response } from "express";
import type { ClientDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { FormValidator } from "#src/utils/FormValidator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export class ClientDetailsAdaptor {
  formValidator: FormValidator;
  constructor(formValidator: FormValidator) {
    this.formValidator = formValidator;
  }
  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/client-details/name-and-dob", { csrfToken });
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
    req.session.hasNameChanged = hasNameChanged === "true";

    this.formValidator.validateClientName(req.body);
    this.formValidator.validateClientDob(req.body);

    if (
      Object.keys(this.formValidator.errorSummaries).length > EMPTY_ARR_LENGTH
    ) {
      res.render("apply/client-details/name-and-dob", {
        csrfToken,
        errorSummaries: this.formValidator.errorSummaries,
        client: {
          clientFirstName: req.session.clientFirstName,
          clientLastName: req.session.clientLastName,
          clientLastNameAtBirth: req.session.clientLastNameAtBirth,
          hasNameChanged: req.session.hasNameChanged,
          clientDob: `${dobYear}/${dobMonth}/${dobDay}`,
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
      body: { "has-nino": hasNino, "nino-input": ninoInput },
    } = req;
    req.session.clientNino = hasNino === "true" ? ninoInput : null;
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
      body: {
        "has-prev-application": hasPrevApplication,
        "prev-laa-reference-input": prevLaaReferenceInput,
      },
    } = req;
    req.session.clientHasPrevApplication = hasPrevApplication === "true";
    req.session.prevLaaReferenceInput =
      hasPrevApplication === "true" ? prevLaaReferenceInput : null;
    res.redirect("/apply/proceedings");
  }
}
