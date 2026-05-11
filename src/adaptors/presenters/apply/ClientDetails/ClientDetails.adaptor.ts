import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Request, Response } from "express";
import type { ClientDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import type { FormValidator } from "#src/utils/FormValidator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";

export class ClientDetailsAdaptor {
  formValidator: FormValidator;
  constructor(formValidator: FormValidator) {
    this.formValidator = formValidator;
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
      const checkProceedings = (
        proceedings: Proceeding[] | undefined | null,
      ): boolean => proceedings !== undefined && proceedings !== null;
      const redirectUrl = checkProceedings(req.session.selectedProceedings)
        ? "/apply/proceedings/confirmation"
        : "/apply/proceedings";
      res.redirect(redirectUrl);
    }
  }
}
