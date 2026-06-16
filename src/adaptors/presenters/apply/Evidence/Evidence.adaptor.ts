import type { Request, Response } from "express";
import type { EvidenceValidator } from "./Evidence.validator.js";
import type { SdsPort } from "#src/ports/source/sds/Sds.port.js";

export class EvidenceAdaptor {
  evidenceValidator: EvidenceValidator;
  sdsPort: SdsPort;

  constructor(evidenceValidator: EvidenceValidator, sdsPort: SdsPort) {
    this.evidenceValidator = evidenceValidator;
    this.sdsPort = sdsPort;
  }

  renderUploadCoronersLetterForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/evidence/upload-coroners-letter", {
      csrfToken,
      uploadedFile: req.session.coronersLetterFile,
    });
  }

  async processUploadCoronersLetterForm(req: Request, res: Response): Promise<void> {
    const {
      locals: { csrfToken },
    } = res;

    const file = req.file;
    const errors = this.evidenceValidator.validateFileUpload(file);

    if (Object.keys(errors).length > 0) {
      res.render("apply/evidence/upload-coroners-letter", {
        csrfToken,
        uploadedFile: req.session.coronersLetterFile,
        errorSummaries: errors,
      });
      return;
    }

    try {
      const savedFile = await this.sdsPort.saveFile(file!);
      req.session.coronersLetterFile = {
        fileId: savedFile.fileId,
        fileName: file!.originalname,
      };
      res.redirect("/apply/check-your-answers");
    } catch {
      res.render("apply/evidence/upload-coroners-letter", {
        csrfToken,
        uploadedFile: req.session.coronersLetterFile,
        errorSummaries: {
          uploadFailed: {
            text: "The file could not be uploaded. Please try again.",
          },
        },
      });
    }
  }

  deleteUploadedFile(req: Request, res: Response): void {
    req.session.coronersLetterFile = undefined;
    res.redirect("/apply/evidence/upload");
  }
}
