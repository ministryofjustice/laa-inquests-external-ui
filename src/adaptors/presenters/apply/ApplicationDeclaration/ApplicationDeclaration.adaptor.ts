import type { Request, Response } from "express";

import { logger } from "#src/infrastructure/logging/logger.js";
import type { ValidateBeforeYouStartDeclarationUseCase } from "#src/use-cases/common/validateDeclaration/ValidateBeforeYouStartDeclaration.useCase.js";
import type { ApplicationDeclarationFormData } from "#src/adaptors/presenters/apply/ApplicationDeclaration/models/ApplicationDeclaration.types.js";

export class ApplicationDeclarationAdaptor {
  validateBeforeYouStartDeclarationUseCase: ValidateBeforeYouStartDeclarationUseCase;

  constructor(useCase: ValidateBeforeYouStartDeclarationUseCase) {
    this.validateBeforeYouStartDeclarationUseCase = useCase;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const alreadyDeclared = req.session.applicationDeclaration === true;

    res.render("apply/application-declaration", {
      csrfToken,
      alreadyDeclared,
    });
  }

  processForm(req: Request, res: Response): void {
    const { "application-declaration-confirmation": declarationConfirmation } =
      req.body as ApplicationDeclarationFormData;
    const result = this.validateBeforeYouStartDeclarationUseCase.execute(
      declarationConfirmation,
    );

    if (result.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;

      res.render("apply/application-declaration", {
        csrfToken,
        errorSummaries: result.errorSummaries,
      });
      return;
    }
    req.session.applicationDeclaration = true;
    logger.logInfo({
      functionName: "application_declaration",
      message: "Application declaration submitted",
      request: req,
      extraContext: {
        event: "application_declaration_submitted",
      },
    });
    res.redirect("/apply/office-accounts");
  }
}
