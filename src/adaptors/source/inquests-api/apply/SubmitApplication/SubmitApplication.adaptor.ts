import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "./models/SubmitApplication.types.js";

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
    private readonly payloadDebugEnabled = false,
    private readonly logger: (message: string) => void = () => undefined,
  ) {}

  async submitApplication(
    _body: SubmitApplicationRequest,
  ): Promise<SubmitApplicationResponse> {
    if (this.payloadDebugEnabled) {
      this.logger(
        JSON.stringify({ event: "submit.application.payload", payload: _body }),
      );
    }

    const response: AxiosResponse<SubmitApplicationResponse> =
      await this.http.post(`${this.baseUrl}/applications`, _body);

    const submitApplicationResponse: SubmitApplicationResponse = {
      statusCode: response.status,
      laaReference: response.data.laaReference,
    };
    return submitApplicationResponse;
  }
}
