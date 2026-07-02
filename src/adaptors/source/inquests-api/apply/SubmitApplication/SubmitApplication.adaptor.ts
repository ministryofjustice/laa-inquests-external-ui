import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "./models/SubmitApplication.types.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
    private readonly payloadDebugEnabled = false,
    private readonly logger: (message: string) => void = () => undefined,
  ) {}

  async submitApplication(
    _body: SubmitApplicationRequest,
    accessToken: string | undefined,
  ): Promise<SubmitApplicationResponse> {
    if (this.payloadDebugEnabled) {
      this.logger(
        JSON.stringify({ event: "submit.application.payload", payload: _body }),
      );
    }

    const response: AxiosResponse<SubmitApplicationResponse> =
      await postToInquestsApi<
        SubmitApplicationResponse,
        SubmitApplicationRequest
      >({
        http: this.http,
        baseUrl: this.baseUrl,
        path: "/applications/",
        body: _body,
        accessToken,
      });

    const submitApplicationResponse: SubmitApplicationResponse = {
      statusCode: response.status,
      laaReference: response.data.laaReference,
    };
    return submitApplicationResponse;
  }
}
