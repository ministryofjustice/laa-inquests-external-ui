import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { DeceasedDetailsFormData } from "../models/form.types.js";
import type { DeceasedDetailsValidator } from "./DeceasedDetails.validator.js";
import type { Request, Response } from "express";
import { getStringValue } from "#src/utils/sessionValue.js";

type DeceasedDetailsStep =
  | "name"
  | "dateOfDeath"
  | "dateOfBirth"
  | "clientRelationship"
  | "coronerReference"
  | "furtherInformation";

export class DeceasedDetailsAdaptor {
  formValidator: DeceasedDetailsValidator;

  constructor(formValidator: DeceasedDetailsValidator) {
    this.formValidator = formValidator;
  }

  #getNameBackButtonUrl(proceedings: Proceeding[] | undefined | null): string {
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
    const nameView = this.#buildDeceasedDetailsView("name", {
      deceasedFirstName: getStringValue(req.session.deceasedFirstName),
      deceasedLastName: getStringValue(req.session.deceasedLastName),
    });

    res.render("apply/deceased-details/name", {
      csrfToken,
      backButtonUrl,
      deceasedDetails: nameView.deceasedDetails,
    });
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
      const backButtonUrl = this.#getNameBackButtonUrl(
        req.session.selectedProceedings,
      );
      const nameView = this.#buildDeceasedDetailsView("name", {
        deceasedFirstName: firstName,
        deceasedLastName: lastName,
      });

      res.render("apply/deceased-details/name", {
        csrfToken,
        backButtonUrl,
        errorSummaries,
        deceasedDetails: nameView.deceasedDetails,
      });
    } else {
      res.redirect("/apply/deceased-details/dod");
    }
  }

  renderDateOfDeathForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const dateOfDeathView = this.#buildDeceasedDetailsView("dateOfDeath", {
      deceasedDateOfDeathDay: getStringValue(
        req.session.deceasedDateOfDeathDay,
      ),
      deceasedDateOfDeathMonth: getStringValue(
        req.session.deceasedDateOfDeathMonth,
      ),
      deceasedDateOfDeathYear: getStringValue(
        req.session.deceasedDateOfDeathYear,
      ),
    });

    res.render("apply/deceased-details/date-of-death", {
      csrfToken,
      deceasedDetails: dateOfDeathView.deceasedDetails,
    });
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
      const dateOfDeathView = this.#buildDeceasedDetailsView("dateOfDeath", {
        deceasedDateOfDeathDay: dateOfDeathDay,
        deceasedDateOfDeathMonth: dateOfDeathMonth,
        deceasedDateOfDeathYear: dateOfDeathYear,
      });

      res.render("apply/deceased-details/date-of-death", {
        csrfToken,
        errorSummaries,
        deceasedDetails: dateOfDeathView.deceasedDetails,
      });
    } else {
      res.redirect("/apply/deceased-details/dob");
    }
  }

  renderDateOfBirthForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const dateOfBirthView = this.#buildDeceasedDetailsView("dateOfBirth", {
      deceasedDateOfBirthDay: getStringValue(
        req.session.deceasedDateOfBirthDay,
      ),
      deceasedDateOfBirthMonth: getStringValue(
        req.session.deceasedDateOfBirthMonth,
      ),
      deceasedDateOfBirthYear: getStringValue(
        req.session.deceasedDateOfBirthYear,
      ),
    });

    res.render("apply/deceased-details/dob", {
      csrfToken,
      deceasedDetails: dateOfBirthView.deceasedDetails,
    });
  }

  processDateOfBirthForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
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
      const dateOfBirthView = this.#buildDeceasedDetailsView("dateOfBirth", {
        deceasedDateOfBirthDay: dateOfBirthDay,
        deceasedDateOfBirthMonth: dateOfBirthMonth,
        deceasedDateOfBirthYear: dateOfBirthYear,
      });

      res.render("apply/deceased-details/dob", {
        csrfToken,
        errorSummaries,
        deceasedDetails: dateOfBirthView.deceasedDetails,
      });
    } else {
      res.redirect("/apply/deceased-details/client-relationship");
    }
  }

  renderClientRelationshipForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const clientRelationshipView = this.#buildDeceasedDetailsView(
      "clientRelationship",
      {
        deceasedHasClientRelationship: getStringValue(
          req.session.deceasedHasClientRelationship,
        ),
        deceasedClientRelationship: getStringValue(
          req.session.deceasedClientRelationship,
        ),
      },
    );

    res.render("apply/deceased-details/client-relationship", {
      csrfToken,
      deceasedDetails: clientRelationshipView.deceasedDetails,
    });
  }

  processClientRelationshipForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
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
      const clientRelationshipView = this.#buildDeceasedDetailsView(
        "clientRelationship",
        {
          deceasedHasClientRelationship,
          deceasedClientRelationship,
        },
      );

      res.render("apply/deceased-details/client-relationship", {
        csrfToken,
        errorSummaries,
        deceasedDetails: clientRelationshipView.deceasedDetails,
      });
    } else {
      res.redirect("/apply/deceased-details/coroner-reference");
    }
  }

  renderCoronerReferenceForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const coronerReferenceView = this.#buildDeceasedDetailsView(
      "coronerReference",
      {
        deceasedCoronerReference: getStringValue(
          req.session.deceasedCoronerReference,
        ),
      },
    );

    res.render("apply/deceased-details/coroner-reference", {
      csrfToken,
      deceasedDetails: coronerReferenceView.deceasedDetails,
    });
  }

  processCoronerReferenceForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
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
      const coronerReferenceView = this.#buildDeceasedDetailsView(
        "coronerReference",
        {
          deceasedCoronerReference,
        },
      );

      res.render("apply/deceased-details/coroner-reference", {
        csrfToken,
        errorSummaries,
        deceasedDetails: coronerReferenceView.deceasedDetails,
      });
    } else {
      res.redirect("/apply/deceased-details/further-information");
    }
  }

  renderFurtherInfomationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const furtherInformationView = this.#buildDeceasedDetailsView(
      "furtherInformation",
      {
        deceasedHasFurtherInformation: getStringValue(
          req.session.deceasedHasFurtherInformation,
        ),
        deceasedFurtherInformation: getStringValue(
          req.session.deceasedFurtherInformation,
        ),
      },
    );

    res.render("apply/deceased-details/further-information", {
      csrfToken,
      deceasedDetails: furtherInformationView.deceasedDetails,
    });
  }

  processFurtherInfomationForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
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
    req.session.deceasedFurtherInformation =
      deceasedHasFurtherInformation === "true"
        ? deceasedFurtherInformation
        : null;

    const errorSummaries = this.formValidator.validateFurtherInformation(
      req.body,
    );

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      const furtherInformationView = this.#buildDeceasedDetailsView(
        "furtherInformation",
        {
          deceasedHasFurtherInformation,
          deceasedFurtherInformation,
        },
      );

      res.render("apply/deceased-details/further-information", {
        csrfToken,
        errorSummaries,
        deceasedDetails: furtherInformationView.deceasedDetails,
      });
    } else {
      res.redirect("/apply/public-authority");
    }
  }

  #buildDeceasedDetailsView(
    step: DeceasedDetailsStep,
    state: {
      deceasedFirstName?: string;
      deceasedLastName?: string;
      deceasedDateOfDeathDay?: string;
      deceasedDateOfDeathMonth?: string;
      deceasedDateOfDeathYear?: string;
      deceasedDateOfBirthDay?: string;
      deceasedDateOfBirthMonth?: string;
      deceasedDateOfBirthYear?: string;
      deceasedHasClientRelationship?: string;
      deceasedClientRelationship?: string;
      deceasedCoronerReference?: string;
      deceasedHasFurtherInformation?: string;
      deceasedFurtherInformation?: string;
    },
  ): { deceasedDetails: Record<string, string | undefined> } {
    if (step === "name") {
      return {
        deceasedDetails: {
          firstName: state.deceasedFirstName,
          lastName: state.deceasedLastName,
        },
      };
    }

    if (step === "dateOfDeath") {
      return {
        deceasedDetails: {
          dateOfDeathDay: state.deceasedDateOfDeathDay,
          dateOfDeathMonth: state.deceasedDateOfDeathMonth,
          dateOfDeathYear: state.deceasedDateOfDeathYear,
        },
      };
    }

    if (step === "dateOfBirth") {
      return {
        deceasedDetails: {
          dateOfBirthDay: state.deceasedDateOfBirthDay,
          dateOfBirthMonth: state.deceasedDateOfBirthMonth,
          dateOfBirthYear: state.deceasedDateOfBirthYear,
        },
      };
    }

    if (step === "clientRelationship") {
      return {
        deceasedDetails: {
          hasClientRelationship: state.deceasedHasClientRelationship,
          clientRelationship: state.deceasedClientRelationship,
        },
      };
    }

    if (step === "coronerReference") {
      return {
        deceasedDetails: {
          coronerReference: state.deceasedCoronerReference,
        },
      };
    }

    return {
      deceasedDetails: {
        hasFurtherInformation: state.deceasedHasFurtherInformation,
        furtherInformation: state.deceasedFurtherInformation,
      },
    };
  }
}
