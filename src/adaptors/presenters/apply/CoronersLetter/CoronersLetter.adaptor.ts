import type { Request, Response } from "express";
import type { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import type { UploadCoronersLetterValidator } from "./CoronersLetter.validator.js";
import {
  CORONERS_LETTER_ERROR,
  EMPTY_ARR_LENGTH,
  HTTP_SERVICE_UNAVAILABLE,
} from "#src/infrastructure/locales/constants.js";

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

    this.#captureCheckYourAnswersEntry(req);

    res.render("apply/upload-coroners-letter", {
      csrfToken,
      uploadedFile: req.session.coronersLetterFile,
      backHref: this.#resolveBackHref(req),
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
        backHref: this.#resolveBackHref(req),
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
      if (
        result.status === "TECHNICAL_FAILURE" &&
        result.reason === "FILE_SCAN_FOUND_VIRUS"
      ) {
        res.render("apply/upload-coroners-letter", {
          csrfToken: res.locals.csrfToken,
          errorSummaries: {
            coronersLetterError: {
              text: CORONERS_LETTER_ERROR.FILE_SCAN_FOUND_VIRUS,
            },
          },
          backHref: this.#resolveBackHref(req),
        });
        return;
      }

      res.status(HTTP_SERVICE_UNAVAILABLE).render("main/error", {
        status: "503",
        error: "Service unavailable. Please try again later.",
      });
      return;
    }

    req.session.returnToApplyCheckYourAnswers = undefined;
    res.redirect("/apply/check-your-answers");
  }

  #captureCheckYourAnswersEntry(req: Request): void {
    if (req.query.from === "check-your-answers") {
      req.session.returnToApplyCheckYourAnswers = true;
    }
  }

  #resolveBackHref(req: Request): string {
    if (req.session.returnToApplyCheckYourAnswers === true) {
      return "/apply/check-your-answers";
    }

    return "/apply/public-authority";
  }
}
