import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  SubmitApplicationRequest,
  SubmitApplicationResponse,
} from "./models/SubmitApplication.types.js";
import { SubmitApplicationResponseSchema } from "./models/SubmitApplication.schema.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const OPERATION = "submit_application";
const UPSTREAM_METHOD = "POST";
const UPSTREAM_ROUTE = "/applications";

export class SubmitApplicationAdaptor implements ApplySubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
    private readonly payloadDebugEnabled = false,
  ) {}

  async submitApplication(
    body: SubmitApplicationRequest,
    accessToken: string | undefined,
  ): Promise<SubmitApplicationResponse> {
    const startedAt = Date.now();

    if (this.payloadDebugEnabled) {
      logger.logDebug({
        functionName: "submitApplication",
        message: "DEBUG APPLICATION BODY NOT SUITABLE FOR PRODUCTION",
        extraContext: {
          event: "submit_application_payload_debug",
          application: body,
        },
      });
    }

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response: AxiosResponse<{ laaReference?: unknown }> =
        await postToInquestsApi<
          { laaReference?: unknown },
          SubmitApplicationRequest
        >({
          http: this.http,
          baseUrl: this.baseUrl,
          path: "/applications/",
          body,
          accessToken,
        });

      const parsed = SubmitApplicationResponseSchema.parse({
        laaReference: response.data.laaReference,
      });

      logger.logInfo({
        functionName: "submit_application_adaptor",
        message: "Application submission completed successfully",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
          laa_reference: parsed.laaReference,
        },
      });

      return parsed;
    } catch (error) {
      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "submit_application_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
