import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  PUBLIC_AUTHORITY_SUCCESS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PublicAuthorityValidator,
  PublicAuthorityFormData,
  RemovePublicAuthorityFormData,
} from "./PublicAuthority.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";
import { BuildPublicAuthoritySelectionViewUseCase } from "#src/use-cases/apply/publicAuthority/BuildPublicAuthoritySelectionView.useCase.js";
import { AddPublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.js";
import { RemovePublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/RemovePublicAuthority.useCase.js";

interface PublicAuthorityUseCases {
  buildPublicAuthoritySelectionView: BuildPublicAuthoritySelectionViewUseCase;
  addPublicAuthority: AddPublicAuthorityUseCase;
  removePublicAuthority: RemovePublicAuthorityUseCase;
}

export class PublicAuthorityAdaptor {
  formValidator: PublicAuthorityValidator;
  formatter: Formatter;
  buildPublicAuthoritySelectionViewUseCase: BuildPublicAuthoritySelectionViewUseCase;
  addPublicAuthorityUseCase: AddPublicAuthorityUseCase;
  removePublicAuthorityUseCase: RemovePublicAuthorityUseCase;

  constructor(
    formValidator: PublicAuthorityValidator,
    formatter: Formatter,
    useCases?: Partial<PublicAuthorityUseCases>,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.buildPublicAuthoritySelectionViewUseCase =
      useCases?.buildPublicAuthoritySelectionView ??
      new BuildPublicAuthoritySelectionViewUseCase();
    this.addPublicAuthorityUseCase =
      useCases?.addPublicAuthority ?? new AddPublicAuthorityUseCase();
    this.removePublicAuthorityUseCase =
      useCases?.removePublicAuthority ?? new RemovePublicAuthorityUseCase();
  }

  renderPublicAuthoritySelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const selectionView = this.buildPublicAuthoritySelectionViewUseCase.execute(
      {
        selectedPublicAuthorities: req.session.selectedPublicAuthorities,
      },
    );

    res.render("apply/public-authority/add-public-authority", {
      csrfToken,
      publicAuthorityOptions:
        this.formatter.formatPublicAuthorityOptionsIntoList(
          selectionView.availablePublicAuthorities,
        ),
      publicAuthorityOption: req.session.publicAuthorityOption,
      selectedPublicAuthorities: this.formatter.formatIntoTableRows(
        selectionView.selectedPublicAuthorities,
      ),
      isAddingAnother:
        selectionView.selectedPublicAuthorities.length > EMPTY_ARR_LENGTH,
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

    const addPublicAuthorityResult = this.addPublicAuthorityUseCase.execute(
      publicAuthorityOption,
      {
        selectedPublicAuthorities: req.session.selectedPublicAuthorities,
      },
    );

    if (
      (publicAuthorityOption === undefined &&
        Object.keys(errors).length > EMPTY_ARR_LENGTH) ||
      addPublicAuthorityResult.status !== "SUCCESS" ||
      addPublicAuthorityResult.data === undefined
    ) {
      const selectionView =
        this.buildPublicAuthoritySelectionViewUseCase.execute({
          selectedPublicAuthorities: req.session.selectedPublicAuthorities,
        });

      res.render("apply/public-authority/add-public-authority", {
        csrfToken,
        publicAuthorityOptions:
          this.formatter.formatPublicAuthorityOptionsIntoList(
            selectionView.availablePublicAuthorities,
          ),
        publicAuthorityOption: req.session.publicAuthorityOption,
        selectedPublicAuthorities: this.formatter.formatIntoTableRows(
          selectionView.selectedPublicAuthorities,
        ),
        errorSummaries: errors,
        isAddingAnother:
          selectionView.selectedPublicAuthorities.length > EMPTY_ARR_LENGTH,
      });
    } else {
      const { data } = addPublicAuthorityResult;
      const { selectedPublicAuthority, selectedPublicAuthorities } = data;

      req.session.publicAuthorityOption = { ...selectedPublicAuthority };
      req.session.selectedPublicAuthorities = selectedPublicAuthorities;

      res.redirect("/apply/public-authority/confirmation");
    }
  }

  renderPublicAuthorityConfirmation(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      session: { selectedPublicAuthorities, successMessage },
    } = req;

    if (selectedPublicAuthorities === undefined) {
      res.redirect("/apply/public-authority");
    } else {
      req.session.successMessage = undefined;

      const selectionView =
        this.buildPublicAuthoritySelectionViewUseCase.execute({
          selectedPublicAuthorities,
        });

      res.render("apply/public-authority/confirmation", {
        csrfToken,
        selectedPublicAuthorities: this.formatter.formatIntoTableRows(
          selectionView.selectedPublicAuthorities,
        ),
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
    req: TypedRequestBody<RemovePublicAuthorityFormData>,
    res: Response,
  ): void {
    const {
      body: {
        publicAuthorityId,
        "remove-public-authority": removePublicAuthority,
      },
      session: { selectedPublicAuthorities },
    } = req;

    const removePublicAuthorityResult =
      this.removePublicAuthorityUseCase.execute(
        publicAuthorityId,
        removePublicAuthority,
        {
          selectedPublicAuthorities,
        },
      );

    if (
      removePublicAuthorityResult.status === "SUCCESS" &&
      removePublicAuthorityResult.data !== undefined
    ) {
      const { data } = removePublicAuthorityResult;
      const {
        selectedPublicAuthorities: updatedPublicAuthorities,
        hasRemovedPublicAuthority,
      } = data;
      req.session.selectedPublicAuthorities = updatedPublicAuthorities;
      req.session.successMessage = hasRemovedPublicAuthority
        ? PUBLIC_AUTHORITY_SUCCESS.REMOVED
        : undefined;
    }

    res.redirect("/apply/public-authority/confirmation");
  }
}
