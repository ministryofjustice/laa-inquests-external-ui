import axios, { type AxiosResponse, type AxiosStatic } from "axios";
import type { Application } from "#src/adaptors/models/application.types.js";
import { ApplicationSchema } from "#src/adaptors/models/application.schema.js";

export class ApplicationApiAdaptor {
  constructor(
    private readonly http: AxiosStatic = axios,
    private readonly baseUrl: string,
  ) {}

  async getApplicationById(applicationId: string): Promise<Application> {
    const { data }: AxiosResponse<Application> = await this.http.get(
      `${this.baseUrl}/applications/${applicationId}`,
    );
    const application = ApplicationSchema.parse(data);
    return application;
  }
}
