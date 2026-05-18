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
      isAddingAnother: selectedPublicAuthorities.length > 0,
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
        isAddingAnother: selectedPublicAuthorities.length > 0,
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
      const { successMessage } = req.session;
      delete req.session.successMessage;

      const formattedSelected = this.formatter.formatIntoTableRows(
        req.session.selectedPublicAuthorities,
      );

      res.render("apply/public-authority/confirmation", {
        csrfToken,
        selectedPublicAuthorities: formattedSelected,
        successMessage,
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
      session: { selectedPublicAuthorities = [] },
    } = req;

    const formattedSelected = this.formatter.formatIntoTableRows(
      selectedPublicAuthorities,
    );

    const confirmationErrors =
      this.formValidator.validateAddAnotherPublicAuthority(req.body);

    if (Object.keys(confirmationErrors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/public-authority/confirmation", {
        csrfToken,
        selectedPublicAuthorities: formattedSelected,
        errorSummaries: confirmationErrors,
      });
      return;
    }

    if (isAddingAnother === "true") {
      res.redirect("/apply/public-authority");
      return;
    }

    if (isAddingAnother === "false") {
      const listErrors = this.formValidator.validatePublicAuthorityList(
        selectedPublicAuthorities,
      );

      if (Object.keys(listErrors).length > EMPTY_ARR_LENGTH) {
        res.render("apply/public-authority/confirmation", {
          csrfToken,
          selectedPublicAuthorities: formattedSelected,
          errorSummaries: listErrors,
        });
        return;
      }

      res.redirect("/apply/check-your-answers");
    }
  }

  renderPublicAuthorityRemoveForm(req: Request, res: Response): void {
    const {
      query: { publicAuthorityId },
      session: { selectedPublicAuthorities },
    } = req;
    const {
      locals: { csrfToken },
    } = res;

    const publicAuthorityToRemove = selectedPublicAuthorities?.find(
      (publicAuthority) =>
        publicAuthority.publicAuthorityId === publicAuthorityId,
    );

    if (publicAuthorityToRemove === undefined) {
      res.redirect("/apply/public-authority/confirmation");
    } else {
      res.render("apply/public-authority/remove-public-authority", {
        csrfToken,
        publicAuthorityName: publicAuthorityToRemove.publicAuthorityDescription,
        publicAuthorityId: publicAuthorityToRemove.publicAuthorityId,
      });
    }
  }

  processPublicAuthorityRemove(
    req: TypedRequestBody<{
      publicAuthorityId: string;
      "remove-public-authority": string;
    }>,
    res: Response,
  ): void {
    const {
      body: {
        publicAuthorityId,
        "remove-public-authority": removePublicAuthority,
      },
      session: { selectedPublicAuthorities },
    } = req;

    if (removePublicAuthority === "true") {
      const updatedSelectedPublicAuthorities =
        selectedPublicAuthorities?.filter(
          (publicAuthority) =>
            publicAuthority.publicAuthorityId !== publicAuthorityId,
        ) ?? [];

      req.session.selectedPublicAuthorities = updatedSelectedPublicAuthorities;
      req.session.successMessage = "Public authority has been removed";
    }

    res.redirect("/apply/public-authority/confirmation");
  }
}
