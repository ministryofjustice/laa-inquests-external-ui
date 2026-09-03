import type { Request, Response } from "express";
import type { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import type { DeleteCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/DeleteCoronersLetter.useCase.js";
import type { UploadCoronersLetterValidator } from "./CoronersLetter.validator.js";
import type { UseCaseResult } from "#src/use-cases/common/useCaseResult.types.js";
import {
  CORONERS_LETTER_ERROR,
  EMPTY_ARR_LENGTH,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_UNPROCESSABLE_CONTENT,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "#src/infrastructure/locales/constants.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  buildJsonUploadErrorResponse,
  isNonEmptyString,
  extractFileId,
  isHtmlUploadMode,
  resolveUploadFailureMessage,
} from "#src/adaptors/presenters/claim/common/fileUploadPresenter.utils.js";

const HTTP_SUCCESS = 200;

export class CoronersLetterAdaptor {
  formValidator: UploadCoronersLetterValidator;
  uploadCoronersLetterUseCase: UploadCoronersLetterUseCase;
  deleteCoronersLetterUseCase: DeleteCoronersLetterUseCase;

  constructor(
    formValidator: UploadCoronersLetterValidator,
    uploadCoronersLetterUseCase: UploadCoronersLetterUseCase,
    deleteCoronersLetterUseCase: DeleteCoronersLetterUseCase,
  ) {
    this.formValidator = formValidator;
    this.uploadCoronersLetterUseCase = uploadCoronersLetterUseCase;
    this.deleteCoronersLetterUseCase = deleteCoronersLetterUseCase;
  }

  renderUploadCoronersLetterForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    this.#captureCheckYourAnswersEntry(req);

    res.render("apply/upload-coroners-letter", {
      csrfToken,
      uploadedFiles: this.#buildUploadedFiles(req),
      backHref: this.#resolveBackHref(req),
    });
  }

  processCoronersLetterContinue(req: Request, res: Response): void {
    const errors = this.formValidator.validateCoronersLetterSelection(
      req.session.coronersLetterId,
    );

    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      res.render("apply/upload-coroners-letter", {
        csrfToken: res.locals.csrfToken,
        errorSummaries: errors,
        uploadedFiles: this.#buildUploadedFiles(req),
        backHref: this.#resolveBackHref(req),
      });
      return;
    }

    req.session.returnToApplyCheckYourAnswers = undefined;
    res.redirect("/apply/check-your-answers");
  }

  async processCoronersLetterUpload(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { uploadMode } = req.body as { uploadMode?: string | string[] };
    const body = req.body as {
      delete?: string | string[];
      fileName?: string | string[];
      filename?: string | string[];
    };

    if (isHtmlUploadMode(uploadMode) && extractFileId(body) !== undefined) {
      await this.processCoronersLetterDeleteNoJs(req, res);
      return;
    }

    const { file } = req;
    const isNoJs = isHtmlUploadMode(uploadMode);

    const errors = this.formValidator.validateCoronersLetterUploadFile(
      file,
      req.session.coronersLetterId,
    );
    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      logger.logWarn({
        functionName: "coronersLetterAdaptor_processCoronersLetterUpload",
        message: "Coroners letter upload validation failed",
        request: req,
        extraContext: {
          event: "apply_coroners_letter_upload_validation_failed",
          no_js_upload: isNoJs,
          errors,
        },
      });
      this.#handleValidationFailure(req, res, errors, isNoJs);
    } else {
      const result = await this.uploadCoronersLetterUseCase.execute({
        buffer: file!.buffer,
        mimetype: file!.mimetype,
        originalname: file!.originalname,
        accessToken: req.session.accessToken,
      });

      const hasValidData =
        result.status === "SUCCESS" &&
        isNonEmptyString(result.data?.coronersLetterId) &&
        isNonEmptyString(result.data?.coronersLetterFileName);

      if (hasValidData) {
        this.#handleUploadSuccess({
          req,
          res,
          data: result.data!,
          file: file!,
          isNoJsUpload: isNoJs,
        });
      } else {
        logger.logWarn({
          functionName: "coronersLetterAdaptor_processCoronersLetterUpload",
          message: "Coroners letter upload did not complete successfully",
          request: req,
          extraContext: {
            event: "apply_coroners_letter_upload_failed",
            no_js_upload: isNoJs,
          },
        });
        this.#handleUploadFailure({ req, res, result, isNoJsUpload: isNoJs });
      }
    }
  }

  async processCoronersLetterDelete(
    req: Request,
    res: Response,
  ): Promise<void> {
    const coronersLetterId = extractFileId(req.body as Record<string, unknown>);

    if (typeof coronersLetterId !== "string" || coronersLetterId === "") {
      logger.logWarn({
        functionName: "coronersLetterAdaptor_processCoronersLetterDelete",
        message: "Coroners letter delete request missing file identifier",
        request: req,
        extraContext: {
          event: "apply_coroners_letter_delete_failed",
        },
      });
      res.status(HTTP_BAD_REQUEST).json({
        error: { message: CORONERS_LETTER_ERROR.NO_FILE_CHOSEN },
      });
      return;
    }

    const result = await this.deleteCoronersLetterUseCase.execute({
      coronersLetterId,
      accessToken: req.session.accessToken,
    });

    if (result.status !== "SUCCESS") {
      logger.logWarn({
        functionName: "coronersLetterAdaptor_processCoronersLetterDelete",
        message: "Coroners letter delete failed",
        request: req,
        extraContext: {
          event: "apply_coroners_letter_delete_failed",
        },
      });
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({
        error: { message: SERVICE_UNAVAILABLE_MESSAGE },
      });
      return;
    }

    this.#removeCoronersLetterFromSession(req);
    res.status(HTTP_SUCCESS).json({ success: true });
  }

  async processCoronersLetterDeleteNoJs(
    req: Request,
    res: Response,
  ): Promise<void> {
    const coronersLetterId = extractFileId(req.body as Record<string, unknown>);

    if (typeof coronersLetterId !== "string" || coronersLetterId === "") {
      this.#renderNoJsError(
        req,
        res,
        CORONERS_LETTER_ERROR.NO_FILE_CHOSEN,
        HTTP_BAD_REQUEST,
      );
      return;
    }

    const result = await this.deleteCoronersLetterUseCase.execute({
      coronersLetterId,
      accessToken: req.session.accessToken,
    });

    if (result.status !== "SUCCESS") {
      this.#renderNoJsError(
        req,
        res,
        SERVICE_UNAVAILABLE_MESSAGE,
        HTTP_SERVICE_UNAVAILABLE,
      );
      return;
    }

    this.#removeCoronersLetterFromSession(req);
    res.redirect("/apply/upload-coroners-letter");
  }

  #renderNoJsError(
    req: Request,
    res: Response,
    errorText: string,
    statusCode: number,
  ): void {
    res.status(statusCode).render("apply/upload-coroners-letter", {
      csrfToken: res.locals.csrfToken,
      errorSummaries: {
        coronersLetterError: { text: errorText },
      },
      uploadedFiles: this.#buildUploadedFiles(req),
      backHref: this.#resolveBackHref(req),
    });
  }

  #buildUploadedFiles(req: Request): Array<{
    message: { text: string };
    fileName: string;
    originalFileName: string;
    deleteButton: { text: string };
  }> {
    const { session } = req;
    const { coronersLetterId, coronersLetterFileName } = session;

    return coronersLetterId === undefined ||
      coronersLetterFileName === undefined
      ? []
      : [
          {
            message: { text: coronersLetterFileName },
            fileName: coronersLetterId,
            originalFileName: coronersLetterFileName,
            deleteButton: { text: "Delete" },
          },
        ];
  }

  #renderJsonUploadError(
    res: Response,
    message: string,
    originalname: string | undefined,
    statusCode: number,
  ): void {
    res
      .status(statusCode)
      .json(buildJsonUploadErrorResponse(message, originalname));
  }

  #handleValidationFailure(
    req: Request,
    res: Response,
    errors: { coronersLetterError?: { text: string } },
    isNoJsUpload: boolean,
  ): void {
    const message =
      errors.coronersLetterError?.text ?? CORONERS_LETTER_ERROR.NO_FILE_CHOSEN;

    if (isNoJsUpload) {
      this.#renderNoJsError(req, res, message, HTTP_BAD_REQUEST);
    } else {
      this.#renderJsonUploadError(
        res,
        message,
        req.file?.originalname,
        HTTP_UNPROCESSABLE_CONTENT,
      );
    }
  }

  #handleUploadFailure(options: {
    req: Request;
    res: Response;
    result: UseCaseResult<unknown, unknown>;
    isNoJsUpload: boolean;
  }): void {
    const { req, res, result, isNoJsUpload } = options;
    const message = resolveUploadFailureMessage(
      result,
      CORONERS_LETTER_ERROR.FILE_SCAN_FOUND_VIRUS,
      SERVICE_UNAVAILABLE_MESSAGE,
    );

    if (isNoJsUpload) {
      this.#renderNoJsError(req, res, message, HTTP_SERVICE_UNAVAILABLE);
    } else {
      this.#renderJsonUploadError(
        res,
        message,
        req.file?.originalname,
        HTTP_SERVICE_UNAVAILABLE,
      );
    }
  }

  #handleUploadSuccess(options: {
    req: Request;
    res: Response;
    data: { coronersLetterId: string; coronersLetterFileName: string };
    file: Express.Multer.File;
    isNoJsUpload: boolean;
  }): void {
    const { req, res, data, file, isNoJsUpload } = options;

    this.#storeUploadedCoronersLetter(
      req,
      data.coronersLetterId,
      data.coronersLetterFileName,
    );

    if (isNoJsUpload) {
      res.redirect("/apply/upload-coroners-letter");
    } else {
      res.status(HTTP_CREATED).json({
        success: {
          messageText: `${file.originalname} uploaded`,
          messageHtml: `${file.originalname} uploaded`,
        },
        file: {
          filename: data.coronersLetterId,
          originalname: file.originalname,
        },
      });
    }

    logger.logInfo({
      functionName: "coronersLetterAdaptor_handleUploadSuccess",
      message: "Coroners letter upload completed successfully",
      request: req,
      extraContext: {
        event: "apply_coroners_letter_upload_completed",
        no_js_upload: isNoJsUpload,
      },
    });
  }

  #storeUploadedCoronersLetter(
    req: Request,
    coronersLetterId: string,
    coronersLetterFileName: string,
  ): void {
    if (
      isNonEmptyString(coronersLetterId) &&
      isNonEmptyString(coronersLetterFileName)
    ) {
      req.session.coronersLetterId = coronersLetterId;
      req.session.coronersLetterFileName = coronersLetterFileName;
    }
  }

  #removeCoronersLetterFromSession(req: Request): void {
    req.session.coronersLetterId = undefined;
    req.session.coronersLetterFileName = undefined;
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
