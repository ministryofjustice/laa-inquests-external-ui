import type { Request, Response } from "express";
import {
  CLAIM_FINAL_BILL_TEMPLATE_ERROR,
  EMPTY_ARR_LENGTH,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_UNPROCESSABLE_CONTENT,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "#src/infrastructure/locales/constants.js";
import type { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";
import type { DeleteEvidenceUseCase } from "#src/use-cases/claim/DeleteEvidence.useCase.js";
import type { FinalBillTemplateValidator } from "./FinalBillTemplate.validator.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  buildJsonUploadErrorResponse,
  isNonEmptyString,
  extractFileId,
  isHtmlUploadMode,
  resolveUploadFailureMessage,
} from "#src/adaptors/presenters/claim/common/fileUploadPresenter.utils.js";
const HTTP_SUCCESS = 200;

export class FinalBillTemplateAdaptor {
  formValidator: FinalBillTemplateValidator;
  uploadEvidenceUseCase: UploadEvidenceUseCase;
  deleteEvidenceUseCase: DeleteEvidenceUseCase;

  constructor(
    formValidator: FinalBillTemplateValidator,
    uploadEvidenceUseCase: UploadEvidenceUseCase,
    deleteEvidenceUseCase: DeleteEvidenceUseCase,
  ) {
    this.formValidator = formValidator;
    this.uploadEvidenceUseCase = uploadEvidenceUseCase;
    this.deleteEvidenceUseCase = deleteEvidenceUseCase;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    if (req.query.from === "check-your-answers") {
      req.session.claim = {
        ...req.session.claim,
        returnToCheckYourAnswers: true,
      };
    }

    res.render("claim/final-bill-template", {
      csrfToken,
      uploadedFile: req.session.claim?.finalBillCostTemplate,
      uploadedFiles: this.#buildUploadedFiles(req),
      backHref:
        req.session.claim?.returnToCheckYourAnswers === true
          ? "/claim/check-your-answers"
          : "/claim/total-cost",
    });
  }

  processForm(req: Request, res: Response): void {
    const errors = this.formValidator.validateTemplateSelection(
      req.session.claim?.finalBillCostTemplate,
    );

    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      res.render("claim/final-bill-template", {
        csrfToken: res.locals.csrfToken,
        errorSummaries: errors,
        uploadedFile: req.session.claim?.finalBillCostTemplate,
        uploadedFiles: this.#buildUploadedFiles(req),
      });
    } else if (req.session.claim?.returnToCheckYourAnswers === true) {
      res.redirect("/claim/check-your-answers");
    } else {
      res.redirect("/claim/evidence");
    }
  }

  async processTemplateUpload(req: Request, res: Response): Promise<void> {
    const { uploadMode } = req.body as { uploadMode?: string | string[] };
    const body = req.body as {
      delete?: string | string[];
      fileName?: string | string[];
      filename?: string | string[];
    };

    if (isHtmlUploadMode(uploadMode) && extractFileId(body) !== undefined) {
      await this.processTemplateDeleteNoJs(req, res);
      return;
    }

    const { file } = req;
    const isNoJs = isHtmlUploadMode(uploadMode);

    const errors = this.formValidator.validateTemplateUploadFile(file);
    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      logger.logWarn({
        functionName: "finalBillTemplateAdaptor_processTemplateUpload",
        message: "Final bill template upload validation failed",
        request: req,
        extraContext: {
          event: "claim_final_bill_template_upload_validation_failed",
          no_js_upload: isNoJs,
          errors,
        },
      });
      this.#handleValidationFailure(req, res, errors, isNoJs);
    } else {
      const result = await this.uploadEvidenceUseCase.execute({
        buffer: file!.buffer,
        mimetype: file!.mimetype,
        originalname: file!.originalname,
        accessToken: req.session.accessToken,
      });

      const hasValidData =
        result.status === "SUCCESS" &&
        isNonEmptyString(result.data?.evidenceFileId) &&
        isNonEmptyString(result.data?.evidenceFileName);

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
          functionName: "finalBillTemplateAdaptor_processTemplateUpload",
          message: "Final bill template upload did not complete successfully",
          request: req,
          extraContext: {
            event: "claim_final_bill_template_upload_failed",
            no_js_upload: isNoJs,
          },
        });
        this.#handleUploadFailure({ req, res, result, isNoJsUpload: isNoJs });
      }
    }
  }

  async processTemplateDelete(req: Request, res: Response): Promise<void> {
    const fileId = extractFileId(req.body as Record<string, unknown>);
    if (typeof fileId !== "string" || fileId === "") {
      logger.logWarn({
        functionName: "finalBillTemplateAdaptor_processTemplateDelete",
        message: "Final bill template delete request missing file identifier",
        request: req,
        extraContext: {
          event: "claim_final_bill_template_delete_failed",
        },
      });
      res.status(HTTP_BAD_REQUEST).json({
        error: { message: CLAIM_FINAL_BILL_TEMPLATE_ERROR.NO_FILE_CHOSEN },
      });
      return;
    }

    const result = await this.deleteEvidenceUseCase.execute({
      evidenceFileId: fileId,
      accessToken: req.session.accessToken,
    });

    if (result.status !== "SUCCESS") {
      logger.logWarn({
        functionName: "finalBillTemplateAdaptor_processTemplateDelete",
        message: "Final bill template delete failed",
        request: req,
        extraContext: {
          event: "claim_final_bill_template_delete_failed",
        },
      });
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({
        error: { message: SERVICE_UNAVAILABLE_MESSAGE },
      });
      return;
    }

    this.#removeTemplateFromSession(req);
    res.status(HTTP_SUCCESS).json({ success: true });
  }

  async processTemplateDeleteNoJs(req: Request, res: Response): Promise<void> {
    const fileId = extractFileId(req.body as Record<string, unknown>);
    if (typeof fileId !== "string" || fileId === "") {
      this.#renderNoJsError(
        req,
        res,
        CLAIM_FINAL_BILL_TEMPLATE_ERROR.NO_FILE_CHOSEN,
        HTTP_BAD_REQUEST,
      );
      return;
    }

    const result = await this.deleteEvidenceUseCase.execute({
      evidenceFileId: fileId,
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

    this.#removeTemplateFromSession(req);
    res.redirect("/claim/final-bill-template");
  }

  #renderNoJsError(
    req: Request,
    res: Response,
    errorText: string,
    statusCode: number,
  ): void {
    res.status(statusCode).render("claim/final-bill-template", {
      csrfToken: res.locals.csrfToken,
      errorSummaries: {
        templateError: { text: errorText },
      },
      uploadedFile: req.session.claim?.finalBillCostTemplate,
      uploadedFiles: this.#buildUploadedFiles(req),
    });
  }

  #buildUploadedFiles(req: Request): Array<{
    message: { text: string };
    fileName: string;
    originalFileName: string;
    deleteButton: { text: string };
  }> {
    const template = req.session.claim?.finalBillCostTemplate;

    return template === undefined
      ? []
      : [
          {
            message: { text: template.costTemplateFilename },
            fileName: template.costTemplateId,
            originalFileName: template.costTemplateFilename,
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
    errors: { templateError?: { text: string } },
    isNoJsUpload: boolean,
  ): void {
    const message =
      errors.templateError?.text ??
      CLAIM_FINAL_BILL_TEMPLATE_ERROR.NO_FILE_CHOSEN;

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
    result: { status: string; reason?: string };
    isNoJsUpload: boolean;
  }): void {
    const { req, res, result, isNoJsUpload } = options;
    const message = resolveUploadFailureMessage(
      result,
      CLAIM_FINAL_BILL_TEMPLATE_ERROR.FILE_SCAN_FOUND_VIRUS,
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
    data: { evidenceFileId: string; evidenceFileName: string };
    file: Express.Multer.File;
    isNoJsUpload: boolean;
  }): void {
    const { req, res, data, file, isNoJsUpload } = options;

    this.#storeUploadedTemplate(
      req,
      data.evidenceFileId,
      data.evidenceFileName,
      file.size,
    );

    if (isNoJsUpload) {
      res.redirect("/claim/final-bill-template");
    } else {
      res.status(HTTP_CREATED).json({
        success: {
          messageText: `${file.originalname} uploaded`,
          messageHtml: `${file.originalname} uploaded`,
        },
        file: {
          filename: data.evidenceFileId,
          originalname: file.originalname,
        },
      });
    }

    logger.logInfo({
      functionName: "finalBillTemplateAdaptor_handleUploadSuccess",
      message: "Final bill template upload completed successfully",
      request: req,
      extraContext: {
        event: "claim_final_bill_template_upload_completed",
        no_js_upload: isNoJsUpload,
      },
    });
  }

  #storeUploadedTemplate(
    req: Request,
    costTemplateId: string,
    costTemplateFilename: string,
    costTemplateFileSize: number | undefined,
  ): void {
    if (
      isNonEmptyString(costTemplateId) &&
      isNonEmptyString(costTemplateFilename)
    ) {
      req.session.claim = {
        ...req.session.claim,
        finalBillCostTemplate: {
          costTemplateId,
          costTemplateFilename,
          costTemplateFileSize,
        },
      };
    }
  }

  #removeTemplateFromSession(req: Request): void {
    req.session.claim = {
      ...req.session.claim,
      finalBillCostTemplate: undefined,
    };
  }
}
