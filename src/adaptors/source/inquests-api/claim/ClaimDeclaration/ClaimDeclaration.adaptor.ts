import type { Request, Response } from "express";

import { logger } from "#src/infrastructure/logging/logger.js";
import type { ValidateClaimDeclarationUseCase } from "#src/use-cases/claim/ValidateClaimDeclaration.useCase.js";
import type { ClaimDeclarationFormData } from "#src/adaptors/source/inquests-api/claim/ClaimDeclaration/models/ClaimDeclaration.types.js";

export class ClaimDeclarationAdaptor {
  validateClaimDeclarationUseCase: ValidateClaimDeclarationUseCase;

  constructor(useCase: ValidateClaimDeclarationUseCase) {
    this.validateClaimDeclarationUseCase = useCase;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    const alreadyDeclared = req.session.claimDeclaration === true;
    req.session.claim = undefined;

    res.render("claim/before-you-make-a-claim", {
      csrfToken,
      alreadyDeclared,
    });
  }

  processForm(req: Request, res: Response): void {
    const { "claim-declaration-confirmation": declarationConfirmation } =
      req.body as ClaimDeclarationFormData;
    const result = this.validateClaimDeclarationUseCase.execute(
      declarationConfirmation,
    );

    if (result.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;

      res.render("claim/before-you-make-a-claim", {
        csrfToken,
        errorSummaries: result.errorSummaries,
      });
      return;
    }
    req.session.claimDeclaration = true;
    logger.logInfo({
      functionName: "claim_declaration",
      message: "Claim declaration submitted",
      request: req,
      extraContext: {
        event: "claim_declaration_submitted",
      },
    });
    res.redirect("/claim/search");
  }
}
