import type { Request, Response } from "express";
import type { ApplicationInquestsApiAdaptor } from "#src/adaptors/source/InquestsApi/application.adaptor.js";

export class ApplicationDisplayAdaptor {
  applicationInquestsApi: ApplicationInquestsApiAdaptor;

  constructor(applicationInquestsApi: ApplicationInquestsApiAdaptor) {
    this.applicationInquestsApi = applicationInquestsApi;
  }

  async renderApplicationPage(
    req: Request,
    res: Response,
    applicationId: string,
  ): Promise<void> {
    const displayApplication =
      await this.applicationInquestsApi.getApplication(applicationId);
    res.render("application/index", {
      displayApplication,
    });
  }
}
