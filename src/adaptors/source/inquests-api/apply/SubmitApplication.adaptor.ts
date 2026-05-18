import type {
  ApplySubmitPort,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async submitApplication(
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    try {
      console.log("Submitting application with body:", _body);
      const response: AxiosResponse<SubmitApplicationResponse> =
        await this.http.post(`${this.baseUrl}/applications`, _body);

      const submitApplicationResponse: SubmitApplicationResponse = {
        statusCode: response.status,
        applicationReferenceNumber: response.data.applicationReferenceNumber,
      };
      console.log("Received response:\n", response);
      return submitApplicationResponse;
    } catch (error) {
      console.error("Error submitting application:", error);
      throw error;
    }
  }
}
