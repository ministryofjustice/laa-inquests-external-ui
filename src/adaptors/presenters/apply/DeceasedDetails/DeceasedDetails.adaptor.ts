import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { DeceasedDetailsFormData } from "../models/form.types.js";
import type { DeceasedDetailsValidator } from "./DeceasedDetails.validator.js";
import type { Request, Response } from "express";

export class DeceasedDetailsAdaptor {
  // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases.
  formValidator: DeceasedDetailsValidator;
  constructor(formValidator: DeceasedDetailsValidator) {
    this.formValidator = formValidator;
  }

  #getNameBackButtonUrl(proceedings: Proceeding[] | undefined | null): string {
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases output policy.
    return proceedings !== undefined && proceedings !== null
      ? "/apply/proceedings/confirmation"
      : "/apply/proceedings";
  }

  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const backButtonUrl = this.#getNameBackButtonUrl(
      req.session.selectedProceedings,
    );

    res.render("apply/deceased-details/name", {
      csrfToken,
      backButtonUrl,
      deceasedDetails: {
        firstName: req.session.deceasedFirstName,
        lastName: req.session.deceasedLastName,
      },
    });
  }

  processNameForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedName.
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
      const backButtonUrl = this.#getNameBackButtonUrl(
        req.session.selectedProceedings,
      );

      res.render("apply/deceased-details/name", {
        csrfToken,
        backButtonUrl,
        errorSummaries,
        deceasedDetails: {
          firstName,
          lastName,
        },
      });
    } else {
      res.redirect("/apply/deceased-details/dod");
    }
  }

  renderDateOfDeathForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/date-of-death", {
      csrfToken,
      deceasedDetails: {
        dateOfDeathDay: req.session.deceasedDateOfDeathDay,
        dateOfDeathMonth: req.session.deceasedDateOfDeathMonth,
        dateOfDeathYear: req.session.deceasedDateOfDeathYear,
      },
    });
  }

  processDateOfDeathForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedDateOfDeath.
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
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedDateOfBirth.
    const {
      locals: { csrfToken },
    } = res;

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

    const errorSummaries = this.formValidator.validateDeceasedDateOfBirth(
      req.body,
    );

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/dob", {
        csrfToken,
        errorSummaries,
        deceasedDetails: {
          dateOfBirthDay,
          dateOfBirthMonth,
          dateOfBirthYear,
        },
      });
    } else {
      res.redirect("/apply/deceased-details/client-relationship");
    }
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
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedRelationship.
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: {
        "deceased-client-relationship": deceasedClientRelationship,
        "deceased-has-client-relationship": deceasedHasClientRelationship,
      },
    } = req;

    req.session.deceasedHasClientRelationship = deceasedHasClientRelationship;
    req.session.deceasedClientRelationship = deceasedClientRelationship;

    const errorSummaries = this.formValidator.validateClientRelationship(
      req.body,
    );

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/client-relationship", {
        csrfToken,
        errorSummaries,
        deceasedDetails: {
          hasClientRelationship: deceasedHasClientRelationship,
          clientRelationship: deceasedClientRelationship,
        },
      });
    } else {
      res.redirect("/apply/deceased-details/coroner-reference");
    }
  }

  renderCoronerReferenceForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/coroner-reference", {
      csrfToken,
      deceasedDetails: {
        coronerReference: req.session.deceasedCoronerReference,
      },
    });
  }

  processCoronerReferenceForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedCoronerReference.
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: { "deceased-coroner-reference": deceasedCoronerReference },
    } = req;

    req.session.deceasedCoronerReference = deceasedCoronerReference;

    const errorSummaries = this.formValidator.validateCoronerReference(
      req.body,
    );

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/coroner-reference", {
        csrfToken,
        errorSummaries,
        deceasedDetails: {
          coronerReference: deceasedCoronerReference,
        },
      });
    } else {
      res.redirect("/apply/deceased-details/further-information");
    }
  }

  renderFurtherInfomationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/further-information", {
      csrfToken,
      deceasedDetails: {
        hasFurtherInformation: req.session.deceasedHasFurtherInformation,
        furtherInformation: req.session.deceasedFurtherInformation,
      },
    });
  }

  processFurtherInfomationForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedFurtherInformation.
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: {
        "deceased-has-further-information": deceasedHasFurtherInformation,
        "deceased-further-information": deceasedFurtherInformation,
      },
    } = req;

    req.session.deceasedHasFurtherInformation = deceasedHasFurtherInformation;
    req.session.deceasedFurtherInformation = deceasedFurtherInformation;

    const errorSummaries = this.formValidator.validateFurtherInformation(
      req.body,
    );

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/further-information", {
        csrfToken,
        errorSummaries,
        deceasedDetails: {
          hasFurtherInformation: deceasedHasFurtherInformation,
          furtherInformation: deceasedFurtherInformation,
        },
      });
    } else {
      res.redirect("/apply/public-authority");
    }
  }
}
