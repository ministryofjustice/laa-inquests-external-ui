import { ValidateClaimDeclarationUseCase } from "#src/use-cases/claim/ValidateClaimDeclaration.useCase.js";


import type { Request, Response } from "express";
import type { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";
import type { ClaimDeclarationFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { logger } from "#src/infrastructure/logging/logger.js";

export class ClaimDeclarationAdaptor {
  sessionHelper: SessionHelper;
  validateClaimDeclarationUseCase: ValidateClaimDeclarationUseCase;

  constructor(
    sessionHelper: SessionHelper,
    useCase: ValidateClaimDeclarationUseCase,
  ) {
    this.sessionHelper = sessionHelper;
    this.validateClaimDeclarationUseCase = useCase;
  }

  renderClientDeclarationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/submit/client-declaration", {
      csrfToken,
      clientDetails: {
        firstName: req.session.clientFirstName ?? "",
        lastName: req.session.clientLastName ?? "",
      },
    });
  }

  async processClaimDeclarationForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { "client-declaration-confirmation": declarationConfirmation } =
      req.body as ClaimDeclarationFormData;
    const result = this.validateClaimDeclarationUseCase.execute(
      declarationConfirmation,
    );

    if (result.status === "VALIDATION_FAILED") {
      const {
        locals: { csrfToken },
      } = res;

      res.render("claim", {
        csrfToken,
        errorSummaries: result.errorSummaries,
      });
      return;
    }

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
