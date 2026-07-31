import type { Request, Response } from "express";
import type { DownloadEvidenceUseCase } from "#src/use-cases/claim/DownloadEvidence.useCase.js";
import type { EvidenceDisposition } from "#src/adaptors/source/inquests-api/claim/DownloadEvidence/models/DownloadEvidence.types.js";
import { HTTP_NOT_FOUND } from "#src/infrastructure/locales/constants.js";

export class DownloadEvidenceAdaptor {
  downloadEvidenceUseCase: DownloadEvidenceUseCase;

  constructor(downloadEvidenceUseCase: DownloadEvidenceUseCase) {
    this.downloadEvidenceUseCase = downloadEvidenceUseCase;
  }

  async viewEvidence(req: Request, res: Response): Promise<void> {
    await this.#streamEvidence(req, res, "inline");
  }

  async downloadEvidence(req: Request, res: Response): Promise<void> {
    await this.#streamEvidence(req, res, "attachment");
  }

  async #streamEvidence(
    req: Request,
    res: Response,
    disposition: EvidenceDisposition,
  ): Promise<void> {
    const evidenceId = String(req.params.evidenceId);

    const result = await this.downloadEvidenceUseCase.execute({
      claimEvidenceId: evidenceId,
      disposition,
      accessToken: req.session.accessToken,
    });

    if (result.status === "SUCCESS") {
      res.setHeader("Content-Type", result.data!.contentType);
      res.setHeader("Content-Disposition", result.data!.contentDisposition);
      result.data!.stream.pipe(res);
    } else if (
      result.status === "TECHNICAL_FAILURE" &&
      result.reason === "NOT_FOUND"
    ) {
      res.status(HTTP_NOT_FOUND).render("main/error", {
        status: HTTP_NOT_FOUND,
        message: "Page not found",
      });
    } else {
      res.redirect("/error");
    }
  }
}
