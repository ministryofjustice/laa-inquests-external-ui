import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import { SaveCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/SaveCoronersLetter.useCase.js";
import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";
import type { CoronersLetterFormData } from "#src/adaptors/presenters/apply/models/form.types.js";

export class CoronersLetterAdaptor {
  saveCoronersLetterUseCase: SaveCoronersLetterUseCase;

  constructor(saveCoronersLetterPort: SaveCoronersLetterPort) {
    this.saveCoronersLetterUseCase = new SaveCoronersLetterUseCase(
      saveCoronersLetterPort,
    );
  }

  renderUploadCoronersLetterForm(req: Request, res: Response): void {
    res.render("apply/upload-coroners-letter", {
      uploadedFile: req.session.coronersLetterFile,
    });
  }

  async processCoronersLetterUploadForm(
    req: TypedRequestBody<CoronersLetterFormData>,
    res: Response,
  ): Promise<void> {
    const {
      body: { "coroners-letter-file-upload": fileName },
    } = req;

    await this.saveCoronersLetterUseCase.execute({ fileName });

    res.redirect("/apply/check-your-answers");
  }
}
