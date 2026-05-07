import type { Request, Response } from "express";
import type { FormValidator } from "#src/utils/FormValidator.js";
import {
  EMPTY_ARR_LENGTH,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { ProceedingsFormData } from "./models/form.types.js";

export class ProceedingsAdaptor {
  formValidator: FormValidator;
  constructor(formValidator: FormValidator) {
    this.formValidator = formValidator;
  }
  renderProceedingSelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const formattedProceedings = PROCEEDING_OPTIONS.map((type) => ({
      text: type,
      value: type,
    }));
    const formattedSelectedProceedings = req.session.selectedProceedings?.map(
      (proceeding) => ({
        key: { text: proceeding },
        actions: {
          items: [
            {
              text: "Remove",
            },
          ],
        },
      }),
    );

    res.render("apply/proceedings/add-proceedings", {
      csrfToken,
      proceedingOptions: formattedProceedings,
      proceedingInput: req.session.proceedingInput ?? "",
      selectedProceedings: formattedSelectedProceedings ?? [],
    });
  }

  processProceedingsForm(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "proceeding-option": proceedingOption },
    } = req;

    const proceedingErrors = this.formValidator.validateProceedingInput(
      req.body,
    );

    req.session.proceedingOption = proceedingOption;

    req.session.selectedProceedings = [
      req.session.proceedingOption,
      ...(req.session.selectedProceedings ?? []),
    ];
    const formattedSelectedProceedings = req.session.selectedProceedings?.map(
      (proceeding) => ({
        key: { text: proceeding },
        actions: {
          items: [
            {
              text: "Remove",
            },
          ],
        },
      }),
    );
    const formattedProceedings = PROCEEDING_OPTIONS.map((type) => ({
      text: type,
      value: type,
    }));

    const renderOptions = {
      csrfToken,
      proceedingOptions: formattedProceedings,
      proceedingOption: req.session.proceedingOption,
      selectedProceedings: formattedSelectedProceedings,
    };
    if (Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/proceedings/add-proceedings", {
        ...renderOptions,
        errorSummaries: proceedingErrors,
      });
    } else {
      res.redirect("/apply/proceedings/confirmation");
    }
  }

  renderProceedingsConfirmation(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const formattedSelectedProceedings = req.session.selectedProceedings?.map(
      (proceeding) => ({
        key: { text: proceeding },
        actions: {
          items: [
            {
              href: "#",
              text: "Remove",
            },
          ],
        },
      }),
    );
    const formattedProceedings = PROCEEDING_OPTIONS.map((type) => ({
      text: type,
      value: type,
    }));

    const renderOptions = {
      csrfToken,
      proceedingOptions: formattedProceedings,
      proceedingOption: req.session.proceedingOption,
      selectedProceedings: formattedSelectedProceedings,
    };
    res.render("apply/proceedings/confirmation", renderOptions);
  }

  processProceedingsConfirmation(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "add-another-proceeding": isAddingAnotherProceeding },
    } = req;

    const proceedingErrors = this.formValidator.validateAddAnotherProceeding(
      req.body,
    );
    const formattedSelectedProceedings = req.session.selectedProceedings?.map(
      (proceeding) => ({
        key: { text: proceeding },
        actions: {
          items: [
            {
              href: "#",
              text: "Remove",
            },
          ],
        },
      }),
    );
    const formattedProceedings = PROCEEDING_OPTIONS.map((type) => ({
      text: type,
      value: type,
    }));

    const renderOptions = {
      csrfToken,
      proceedingOptions: formattedProceedings,
      isAddingAnotherProceeding,
      proceedingOption: req.session.proceedingOption,
      selectedProceedings: formattedSelectedProceedings,
    };
    if (Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/proceedings/confirmation", {
        ...renderOptions,
        errorSummaries: proceedingErrors,
      });
    } else if (isAddingAnotherProceeding === "true") {
      res.redirect("/apply/proceedings");
    } else {
      res.redirect("/apply/deceased-details/name");
    }
  }
}
