import type { AxiosInstance, AxiosResponse } from "axios";
import type { DeleteCoronersLetterPort } from "#src/ports/source/inquests-api/DeleteCoronersLetter.port.js";
import type {
  DeleteCoronersLetterRequest,
  DeleteCoronersLetterResponse,
} from "./models/DeleteCoronersLetter.types.js";
import { deleteFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const HTTP_NO_CONTENT = 204;
const OPERATION = "delete_coroners_letter";
const UPSTREAM_METHOD = "DELETE";
const UPSTREAM_ROUTE = "/applications/coroners-letter/:coronersLetterId";

export class DeleteCoronersLetterAdaptor implements DeleteCoronersLetterPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async deleteCoronersLetter(
    body: DeleteCoronersLetterRequest,
    accessToken: string | undefined,
  ): Promise<DeleteCoronersLetterResponse> {
    const startedAt = Date.now();

    try {
      const response: AxiosResponse = await deleteFromInquestsApi({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/coroners-letter/${body.coronersLetterId}`,
        accessToken,
      });

      if (response.status !== HTTP_NO_CONTENT) {
        logger.logWarn({
          functionName: "delete_coroners_letter_adaptor",
          message: "Delete coroners letter rejected by upstream service",
          extraContext: {
            event: "outbound_api_call",
            operation: OPERATION,
            upstream_status_code: response.status,
          },
        });
        return { status: "DELETE_REJECTED" };
      }

      logger.logInfo({
        functionName: "delete_coroners_letter_adaptor",
        message: "Delete coroners letter completed successfully",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });

      return { status: "SUCCESS" };
    } catch (error) {
      logger.logError({
        functionName: "delete_coroners_letter_adaptor",
        message: "Delete coroners letter failed",
        err: error,
        extraContext: {
          event: "outbound_api_request_failed",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });
      return { status: "DELETE_REJECTED" };
    }
  }
}
