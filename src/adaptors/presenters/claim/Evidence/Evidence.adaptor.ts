import type { Request, Response } from "express";
import {
  CLAIM_EVIDENCE_ERROR,
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
import type { UploadEvidenceValidator } from "./Evidence.validator.js";
const HTTP_SUCCESS = 200;

export class EvidenceAdaptor {
  formValidator: UploadEvidenceValidator;
  uploadEvidenceUseCase: UploadEvidenceUseCase;
  deleteEvidenceUseCase: DeleteEvidenceUseCase;

  constructor(
    formValidator: UploadEvidenceValidator,
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

    res.render("claim/evidence", {
      csrfToken,
      uploadedFiles: this.#buildUploadedFiles(req),
    });
  }

  processForm(req: Request, res: Response): void {
    const errors = this.formValidator.validateEvidenceSelection(
      req.session.claim?.evidenceFiles,
    );

    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      res.render("claim/evidence", {
        csrfToken: res.locals.csrfToken,
        errorSummaries: errors,
        uploadedFiles: this.#buildUploadedFiles(req),
      });
    } else {
      res.redirect("/claim/check-your-answers");
    }
  }

  async processEvidenceUpload(req: Request, res: Response): Promise<void> {
    if (
      this.#isNoJsUpload(req) &&
      this.#extractEvidenceFileId(req) !== undefined
    ) {
      await this.processEvidenceDeleteNoJs(req, res);
      return;
    }

    const { file } = req;
    const isNoJsUpload = this.#isNoJsUpload(req);

    const errors = this.formValidator.validateEvidenceUploadFile(file);
    if (Object.keys(errors).length > EMPTY_ARR_LENGTH) {
      this.#handleValidationFailure(req, res, errors, isNoJsUpload);
    } else {
      const result = await this.uploadEvidenceUseCase.execute({
        buffer: file!.buffer,
        mimetype: file!.mimetype,
        originalname: file!.originalname,
        accessToken: req.session.accessToken,
      });

      const hasValidData =
        result.status === "SUCCESS" &&
        this.#checkNonEmptyString(result.data?.evidenceFileId) &&
        this.#checkNonEmptyString(result.data?.evidenceFileName);

      if (hasValidData) {
        this.#handleUploadSuccess({
          req,
          res,
          data: result.data!,
          file: file!,
          isNoJsUpload,
        });
      } else {
        this.#handleUploadFailure({ req, res, result, isNoJsUpload });
      }
    }
  }

  async processEvidenceDelete(req: Request, res: Response): Promise<void> {
    const evidenceFileId = this.#extractEvidenceFileId(req);
    if (typeof evidenceFileId !== "string" || evidenceFileId === "") {
      res.status(HTTP_BAD_REQUEST).json({
        error: { message: CLAIM_EVIDENCE_ERROR.NO_FILE_CHOSEN },
      });
      return;
    }

    const result = await this.deleteEvidenceUseCase.execute({
      evidenceFileId,
      accessToken: req.session.accessToken,
    });

    if (result.status !== "SUCCESS") {
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({
        error: { message: SERVICE_UNAVAILABLE_MESSAGE },
      });
      return;
    }

    this.#removeEvidenceFileFromSession(req, evidenceFileId);
    res.status(HTTP_SUCCESS).json({ success: true });
  }

  async processEvidenceDeleteNoJs(req: Request, res: Response): Promise<void> {
    const evidenceFileId = this.#extractEvidenceFileId(req);
    if (typeof evidenceFileId !== "string" || evidenceFileId === "") {
      this.#renderNoJsError(
        req,
        res,
        CLAIM_EVIDENCE_ERROR.NO_FILE_CHOSEN,
        HTTP_BAD_REQUEST,
      );
      return;
    }

    const result = await this.deleteEvidenceUseCase.execute({
      evidenceFileId,
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

    this.#removeEvidenceFileFromSession(req, evidenceFileId);
    res.redirect("/claim/evidence");
  }

  #isNoJsUpload(req: Request): boolean {
    const { uploadMode } = req.body as { uploadMode?: string | string[] };
    return (
      uploadMode === "html" ||
      (Array.isArray(uploadMode) && uploadMode.includes("html"))
    );
  }

  #extractEvidenceFileId(req: Request): string | undefined {
    const body = req.body as {
      delete?: string | string[];
      fileName?: string | string[];
      filename?: string | string[];
    };
    const candidate = body.delete ?? body.fileName ?? body.filename;
    if (Array.isArray(candidate)) {
      return candidate.find(
        (value) => typeof value === "string" && value !== "",
      );
    }
    return candidate;
  }

  #buildUploadedFiles(req: Request): Array<{
    message: { text: string };
    fileName: string;
    originalFileName: string;
    deleteButton: { text: string };
  }> {
    const uploadedFiles = req.session.claim?.evidenceFiles;

    if (
      Array.isArray(uploadedFiles) &&
      uploadedFiles.length > EMPTY_ARR_LENGTH
    ) {
      return uploadedFiles.map((file) => ({
        message: { text: file.fileName },
        fileName: file.id,
        originalFileName: file.fileName,
        deleteButton: { text: "Delete" },
      }));
    } else {
      return [];
    }
  }

  #renderNoJsError(
    req: Request,
    res: Response,
    errorText: string,
    statusCode: number,
  ): void {
    res.status(statusCode).render("claim/evidence", {
      csrfToken: res.locals.csrfToken,
      errorSummaries: {
        evidenceError: { text: errorText },
      },
      uploadedFiles: this.#buildUploadedFiles(req),
    });
  }

  #renderJsonUploadError(
    res: Response,
    message: string,
    originalname: string | undefined,
    statusCode: number,
  ): void {
    res.status(statusCode).json({
      error: { message },
      file: {
        filename: "",
        originalname: originalname ?? "",
      },
    });
  }

  #handleValidationFailure(
    req: Request,
    res: Response,
    errors: { evidenceError?: { text: string } },
    isNoJsUpload: boolean,
  ): void {
    const message =
      errors.evidenceError?.text ?? CLAIM_EVIDENCE_ERROR.NO_FILE_CHOSEN;

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
    const message =
      result.status === "TECHNICAL_FAILURE" &&
      result.reason === "FILE_SCAN_FOUND_VIRUS"
        ? CLAIM_EVIDENCE_ERROR.FILE_SCAN_FOUND_VIRUS
        : SERVICE_UNAVAILABLE_MESSAGE;

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

  #checkNonEmptyString(value: string | undefined): boolean {
    return typeof value === "string" && value !== "";
  }

  #handleUploadSuccess(options: {
    req: Request;
    res: Response;
    data: { evidenceFileId: string; evidenceFileName: string };
    file: Express.Multer.File;
    isNoJsUpload: boolean;
  }): void {
    const { req, res, data, file, isNoJsUpload } = options;

    this.#storeUploadedFile(
      req,
      data.evidenceFileId,
      data.evidenceFileName,
      file.size,
    );

    if (isNoJsUpload) {
      res.redirect("/claim/evidence");
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
  }

  #storeUploadedFile(
    req: Request,
    evidenceFileId: string,
    evidenceFileName: string,
    fileSize: number | undefined,
  ): void {
    if (
      this.#checkNonEmptyString(evidenceFileId) &&
      this.#checkNonEmptyString(evidenceFileName)
    ) {
      const existingFiles = req.session.claim?.evidenceFiles ?? [];
      req.session.claim = {
        ...req.session.claim,
        evidenceFiles: [
          ...existingFiles,
          {
            id: evidenceFileId,
            fileName: evidenceFileName,
            fileSize,
          },
        ],
      };
    }
  }

  #removeEvidenceFileFromSession(req: Request, evidenceFileId: string): void {
    const existingFiles = req.session.claim?.evidenceFiles ?? [];
    req.session.claim = {
      ...req.session.claim,
      evidenceFiles: existingFiles.filter((file) => file.id !== evidenceFileId),
    };
  }
}
