import type { Request, Response } from "express";
import { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";

export class CoronersLetterAdaptor {
  uploadCoronersLetterUseCase: UploadCoronersLetterUseCase;

  constructor(uploadCoronersLetterPort: UploadCoronersLetterPort) {
    this.uploadCoronersLetterUseCase = new UploadCoronersLetterUseCase(
      uploadCoronersLetterPort,
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

    if (file === undefined) {
      throw new Error("No file uploaded");
    } else {
      const result = await this.uploadCoronersLetterUseCase.execute({
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      });

      if (result.status === "SUCCESS") {
        Object.assign(req.session, {
          coronersLetterId: result.data?.fileId,
        });
      }
    }

    res.redirect("/apply/check-your-answers");
  }
}
