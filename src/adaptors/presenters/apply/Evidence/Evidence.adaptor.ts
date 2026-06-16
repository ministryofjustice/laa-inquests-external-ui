import type { Request, Response } from "express";

export class EvidenceAdaptor {
  renderUploadCoronersLetterForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/evidence/upload-coroners-letter", {
      csrfToken,
      uploadedFile: req.session.coronersLetterFile,
    });
  }
}
