import type { ApplicationByIdPort } from "#src/ports/source/api/application.port.js";
import type { Application } from "#src/domain/models/application.types.js";

export class ViewApplication {
  application: ApplicationByIdPort;

  constructor(
    application: ApplicationByIdPort,
  ) {
    this.application = application;
  }

  async getSingleApplicationDetails(
    applicationId: string,
  ): Promise<Application> {
    const applicationDetails =
      await this.application.getApplicationById(applicationId);

    return applicationDetails;
  }
}
