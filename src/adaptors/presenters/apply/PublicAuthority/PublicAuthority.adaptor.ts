import type { Request, Response } from "express";
import {
  PUBLIC_AUTHORITY_OPTIONS,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PublicAuthorityValidator,
  PublicAuthorityFormData,
} from "./PublicAuthority.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";
import { AddPublicAuthorityUseCase } from "#src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.js";

interface PublicAuthorityUseCases {
  addPublicAuthority: AddPublicAuthorityUseCase;
}

export class PublicAuthorityAdaptor {
  formValidator: PublicAuthorityValidator;
  formatter: Formatter;
  addPublicAuthorityUseCase: AddPublicAuthorityUseCase;

  constructor(
    formValidator: PublicAuthorityValidator,
    formatter: Formatter,
    useCases?: Partial<PublicAuthorityUseCases>,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.addPublicAuthorityUseCase =
      useCases?.addPublicAuthority ?? new AddPublicAuthorityUseCase();
  }

  renderPublicAuthoritySelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const selectedPublicAuthorityIds =
      req.session.selectedPublicAuthorities?.map(
        (auth) => auth.publicAuthorityId,
      ) ?? [];

    res.render("apply/public-authority/add-public-authority", {
      csrfToken,
      publicAuthorityOptions:
        this.formatter.formatPublicAuthorityOptionsIntoList(
          PUBLIC_AUTHORITY_OPTIONS,
        ),
      selectedPublicAuthorityIds,
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
    );

    if (
      Object.keys(errors).length > EMPTY_ARR_LENGTH ||
      addPublicAuthorityResult.status !== "SUCCESS" ||
      addPublicAuthorityResult.data === undefined
    ) {
      res.render("apply/public-authority/add-public-authority", {
        csrfToken,
        publicAuthorityOptions:
          this.formatter.formatPublicAuthorityOptionsIntoList(
            PUBLIC_AUTHORITY_OPTIONS,
          ),
        selectedPublicAuthorityIds: [],
        errorSummaries: errors,
      });
    } else {
      const { data } = addPublicAuthorityResult;
      const { selectedPublicAuthorities } = data;

      req.session.selectedPublicAuthorities = selectedPublicAuthorities;

      res.redirect("/apply/upload-coroners-letter");
    }
  }
}
