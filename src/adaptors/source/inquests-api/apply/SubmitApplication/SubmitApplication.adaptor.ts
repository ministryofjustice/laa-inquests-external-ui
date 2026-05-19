import type {
  ApplySubmitPort,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import { SubmitApplicationRequest, SubmitApplicationResponse } from "./models/SubmitApplication.types.js";

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async submitApplication(
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    const response: AxiosResponse<SubmitApplicationResponse> =
      await this.http.post(`${this.baseUrl}/applications`, _body);

    const submitApplicationResponse: SubmitApplicationResponse = {
      statusCode: response.status,
      laaReference: response.data.laaReference,
    };
    return submitApplicationResponse;
  }
}
