import type { Request, Response } from "express";
import type { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import type { UploadCoronersLetterValidator } from "./CoronersLetter.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import { HTTP_SERVICE_UNAVAILABLE } from "#src/infrastructure/express/middleware/errors.js";

export class CoronersLetterAdaptor {
  formValidator: UploadCoronersLetterValidator;
  uploadCoronersLetterUseCase: UploadCoronersLetterUseCase;

  constructor(
    formValidator: UploadCoronersLetterValidator,
    uploadCoronersLetterUseCase: UploadCoronersLetterUseCase,
  ) {
    this.formValidator = formValidator;
    this.uploadCoronersLetterUseCase = uploadCoronersLetterUseCase;
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
    } else {
      res.status(HTTP_SERVICE_UNAVAILABLE).render("main/error", {
        status: "503",
        error: "Service unavailable. Please try again later.",
      });
      return;
    }

    res.redirect("/apply/check-your-answers");
  }
}
