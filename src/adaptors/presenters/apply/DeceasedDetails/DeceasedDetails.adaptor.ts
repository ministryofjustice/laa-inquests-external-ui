import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { DeceasedDetailsFormData } from "../models/form.types.js";
import type { DeceasedDetailsValidator } from "./DeceasedDetails.validator.js";
import type { Request, Response } from "express";

export class DeceasedDetailsAdaptor {
  formValidator: DeceasedDetailsValidator;
  constructor(formValidator: DeceasedDetailsValidator) {
    this.formValidator = formValidator;
  }

  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/name", { csrfToken });
  }

  processNameForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        "deceased-first-name": firstName,
        "deceased-last-name": lastName,
      },
    } = req;

    const errorSummaries = this.formValidator.validateName(req.body);
    const {
      locals: { csrfToken },
    } = res;

    req.session.deceasedFirstName = firstName;
    req.session.deceasedLastName = lastName;

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/name", { csrfToken, errorSummaries });
    } else {
      res.redirect("/apply/deceased-details/dod");
    }
  }

  renderDateOfDeathForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/date-of-death", { csrfToken });
  }

  processDateOfDeathForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: {
        "deceased-date-of-death-day": dateOfDeathDay,
        "deceased-date-of-death-month": dateOfDeathMonth,
        "deceased-date-of-death-year": dateOfDeathYear,
      },
    } = req;

    req.session.deceasedDateOfDeathDay = dateOfDeathDay;
    req.session.deceasedDateOfDeathMonth = dateOfDeathMonth;
    req.session.deceasedDateOfDeathYear = dateOfDeathYear;

    const errorSummaries = this.formValidator.validateDeceasedDateOfDeath(
      req.body,
    );
    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/date-of-death", {
        csrfToken,
        errorSummaries,
        deceasedDetails: {
          dateOfDeathDay,
          dateOfDeathMonth,
          dateOfDeathYear,
        },
      });
    } else {
      res.redirect("/apply/deceased-details/dob");
    }
  }

  renderDateOfBirthForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/dob", {
      csrfToken,
      deceasedDetails: {
        dateOfBirthDay: req.session.deceasedDateOfBirthDay,
        dateOfBirthMonth: req.session.deceasedDateOfBirthMonth,
        dateOfBirthYear: req.session.deceasedDateOfBirthYear,
      },
    });
  }

  processDateOfBirthForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        "deceased-date-of-birth-day": dateOfBirthDay,
        "deceased-date-of-birth-month": dateOfBirthMonth,
        "deceased-date-of-birth-year": dateOfBirthYear,
      },
    } = req;

    req.session.deceasedDateOfBirthDay = dateOfBirthDay;
    req.session.deceasedDateOfBirthMonth = dateOfBirthMonth;
    req.session.deceasedDateOfBirthYear = dateOfBirthYear;

    res.redirect("/apply/deceased-details/client-relationship");
  }

  renderClientRelationshipForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/client-relationship", {
      csrfToken,
      deceasedDetails: {
        hasClientRelationship: req.session.deceasedHasClientRelationship,
        clientRelationship: req.session.deceasedClientRelationship,
      },
    });
  }

  processClientRelationshipForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        "deceased-client-relationship": deceasedClientRelationship,
        "deceased-has-client-relationship": deceasedHasClientRelationship,
      },
    } = req;

    req.session.deceasedHasClientRelationship = deceasedHasClientRelationship;
    req.session.deceasedClientRelationship = deceasedClientRelationship;
    res.redirect("/apply/deceased-details/coroner-reference");
  }
}
