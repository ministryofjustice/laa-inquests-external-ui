import type { Request, Response } from "express";

export class CoronersLetterAdaptor {
  renderUploadCoronersLetterForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/upload-coroners-letter", {
      csrfToken,
      uploadedFile: req.session.coronersLetterFile,
    });
  }
}
