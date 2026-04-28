import type { Application } from "#src/domain/models/application.types.js";

interface ApplicationByIdPort {
  getApplicationById: (
    applicationId: string,
  ) => Promise<Application>;
}

export type { ApplicationByIdPort };
