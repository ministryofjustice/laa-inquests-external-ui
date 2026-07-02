import type { Request, Response } from "express";
import { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { UploadCoronersLetterValidator } from "./CoronersLetter.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export class CoronersLetterAdaptor {
  formValidator: UploadCoronersLetterValidator;
  uploadCoronersLetterUseCase: UploadCoronersLetterUseCase;

  constructor(
    formValidator: UploadCoronersLetterValidator,
    uploadCoronersLetterPort: UploadCoronersLetterPort,
  ) {
    this.formValidator = formValidator;
    this.uploadCoronersLetterUseCase = new UploadCoronersLetterUseCase(
      uploadCoronersLetterPort,
    );
  }

  renderUploadCoronersLetterForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/upload-coroners-letter", {
      csrfToken,
      uploadedFile: req.session.coronersLetterFile,
    });
  }

  async processCoronersLetterUploadForm(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { file } = req;
      
    const errors = this.formValidator.validateCoronersLetterUploadFile(file);

    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/upload-coroners-letter", {
        csrfToken: res.locals.csrfToken,
        errorSummaries: errors,
      });
      return;
    }

    const result = await this.uploadCoronersLetterUseCase.execute({
        buffer: file!.buffer,
        mimetype: file!.mimetype,
        originalname: file!.originalname,
        accessToken: req.session.accessToken,
      });

    if (result.status === "SUCCESS") {
      Object.assign(req.session, {
        coronersLetterId: result.data?.coronersLetterId,
        coronersLetterFileName: result.data?.coronersLetterFileName,
      });
    }

    res.redirect("/apply/check-your-answers");
  }
}
