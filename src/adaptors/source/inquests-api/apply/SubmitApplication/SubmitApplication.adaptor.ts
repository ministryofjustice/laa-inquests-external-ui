import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "./models/SubmitApplication.types.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
    private readonly payloadDebugEnabled = false,
  ) {}

  async submitApplication(
    _body: SubmitApplicationRequest,
    accessToken: string | undefined,
  ): Promise<SubmitApplicationResponse> {
    if (this.payloadDebugEnabled) {
      logger.logDebug({
        functionName: "submitApplication",
        message: "DEBUG APPLICATION BODY NOT SUITABLE FOR PRODUCTION",
        extraContext: {
          event: "submit_application_payload_debug",
          application: _body,
        },
      });
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
