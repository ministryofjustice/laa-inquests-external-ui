import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  PUBLIC_AUTHORITY_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PublicAuthorityValidator,
  PublicAuthorityFormData,
} from "./PublicAuthority.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";

export class PublicAuthorityAdaptor {
  formValidator: PublicAuthorityValidator;
  formatter: Formatter;

  constructor(formValidator: PublicAuthorityValidator, formatter: Formatter) {
    this.formValidator = formValidator;
    this.formatter = formatter;
  }

  renderPublicAuthoritySelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const selectedPublicAuthorities =
      req.session.selectedPublicAuthorities ?? [];

    const filteredOptions = this.formatter.filterAvailablePublicAuthorities(
      selectedPublicAuthorities,
      PUBLIC_AUTHORITY_OPTIONS,
    );

    const formattedOptions =
      this.formatter.formatPublicAuthorityOptionsIntoList(filteredOptions);

    const formattedSelected = this.formatter.formatIntoTableRows(
      selectedPublicAuthorities,
    );

    res.render("apply/public-authority/add-public-authority", {
      csrfToken,
      publicAuthorityOptions: formattedOptions,
      publicAuthorityOption: req.session.publicAuthorityOption,
      selectedPublicAuthorities: formattedSelected,
    });
  }

  processPublicAuthorityForm(
    req: TypedRequestBody<PublicAuthorityFormData>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: { publicAuthorityOption },
    } = req;

    const errors = this.formValidator.validatePublicAuthorityInput(req.body);

    const selectedPublicAuthorities =
      req.session.selectedPublicAuthorities ?? [];

    const selectedOption = PUBLIC_AUTHORITY_OPTIONS.find(
      (option) => option.publicAuthorityId === publicAuthorityOption,
    );

    if (
      (publicAuthorityOption === undefined &&
        Object.keys(errors).length > EMPTY_ARR_LENGTH) ||
      selectedOption === undefined
    ) {
      const filteredOptions = this.formatter.filterAvailablePublicAuthorities(
        selectedPublicAuthorities,
        PUBLIC_AUTHORITY_OPTIONS,
      );

      const formattedOptions =
        this.formatter.formatPublicAuthorityOptionsIntoList(filteredOptions);

      const formattedSelected = this.formatter.formatIntoTableRows(
        selectedPublicAuthorities,
      );

      res.render("apply/public-authority/add-public-authority", {
        csrfToken,
        publicAuthorityOptions: formattedOptions,
        publicAuthorityOption: req.session.publicAuthorityOption,
        selectedPublicAuthorities: formattedSelected,
        errorSummaries: errors,
      });
    } else {
      req.session.publicAuthorityOption = selectedOption;
      req.session.selectedPublicAuthorities = [
        selectedOption,
        ...selectedPublicAuthorities,
      ];

      res.redirect("/apply/public-authority/confirmation");
    }
  }

  renderPublicAuthorityConfirmation(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    if (req.session.selectedPublicAuthorities === undefined) {
      res.redirect("/apply/public-authority");
    } else {
      const formattedSelected = this.formatter.formatIntoTableRows(
        req.session.selectedPublicAuthorities,
      );

      res.render("apply/public-authority/confirmation", {
        csrfToken,
        selectedPublicAuthorities: formattedSelected,
      });
    }
  }

  processPublicAuthorityConfirmation(
    req: TypedRequestBody<PublicAuthorityFormData>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: { "add-another-public-authority": isAddingAnother },
    } = req;

    const errors = this.formValidator.validateAddAnotherPublicAuthority(
      req.body,
    );

    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      const selectedPublicAuthorities =
        req.session.selectedPublicAuthorities ?? [];

      const formattedSelected = this.formatter.formatIntoTableRows(
        selectedPublicAuthorities,
      );

      res.render("apply/public-authority/confirmation", {
        csrfToken,
        selectedPublicAuthorities: formattedSelected,
        errorSummaries: errors,
      });
    } else if (isAddingAnother === "true") {
      res.redirect("/apply/public-authority");
    } else if (isAddingAnother === "false") {
      res.redirect("/apply/check-your-answers");
    }
  }
}
