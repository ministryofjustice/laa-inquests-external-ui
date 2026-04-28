import type { Request, Response } from "express";
import type { ApplicationApiAdaptor } from "#src/adaptors/source/api/application.js";

export class ApplicationDisplayAdaptor {
  applicationApi: ApplicationApiAdaptor;

  constructor(applicationApi: ApplicationApiAdaptor) {
    this.applicationApi = applicationApi;
  }

  async renderApplicationPage(
    req: Request,
    res: Response,
    applicationId: string,
  ): Promise<void> {
    const displayApplication =
      await this.applicationApi.getApplicationById(applicationId);
    console.log(displayApplication);
    res.render("application/index", {
      displayApplication,
    });
  }
}
