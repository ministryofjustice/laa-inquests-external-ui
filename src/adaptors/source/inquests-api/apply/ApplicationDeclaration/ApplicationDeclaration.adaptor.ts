import type { Request, Response } from "express";

import { logger } from "#src/infrastructure/logging/logger.js";
import type { ValidateApplicationDeclarationUseCase } from "#src/use-cases/apply/applicationDeclaration/ValidateApplicationDeclaration.useCase.js";
import type { ApplicationDeclarationFormData } from "#src/adaptors/source/inquests-api/apply/ApplicationDeclaration/models/ApplicationDeclaration.types.js";

export class ApplicationDeclarationAdaptor {
  validateApplicationDeclarationUseCase: ValidateApplicationDeclarationUseCase;

  constructor(useCase: ValidateApplicationDeclarationUseCase) {
    this.validateApplicationDeclarationUseCase = useCase;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const alreadyDeclared = req.session.applicationDeclaration === true;
    req.session.application = undefined;

    res.render("apply/declaration", {
      csrfToken,
      alreadyDeclared,
    });
  }

  processForm(req: Request, res: Response): void {
    const { "application-declaration-confirmation": declarationConfirmation } =
      req.body as ApplicationDeclarationFormData;
    const result = this.validateApplicationDeclarationUseCase.execute(
      declarationConfirmation,
    );

    if (result.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;

      res.render("apply/declaration", {
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
