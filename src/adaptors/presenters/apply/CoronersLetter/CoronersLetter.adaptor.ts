import type { Request, Response } from "express";
import { SaveCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/SaveCoronersLetter.useCase.js";
import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";

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
    req: Request,
    res: Response,
  ): Promise<void> {
    const { file } = req;

    // TODO: Remove this block when validation is included. Only here currently to not break E2E tests and allow continueing
    if (file === undefined) {
      throw new Error("No file uploaded");
    } else {
      const result = await this.saveCoronersLetterUseCase.execute({
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      });

      if (result.status === "SUCCESS") {
        // eslint-disable-next-line require-atomic-updates -- TODO: Refactor to resolve potential race condition and remove eslint-disable
        req.session.coronersLetterId = result.data?.fileId;
      }
    }

    res.redirect("/apply/check-your-answers");
  }
}
