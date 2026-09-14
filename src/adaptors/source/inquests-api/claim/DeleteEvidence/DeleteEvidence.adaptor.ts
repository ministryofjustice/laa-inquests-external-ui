import type { AxiosInstance, AxiosResponse } from "axios";
import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import type {
  DeleteEvidenceRequest,
  DeleteEvidenceResponse,
} from "./models/DeleteEvidence.types.js";
import { deleteFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const HTTP_NO_CONTENT = 204;
const OPERATION = "delete_evidence";
const UPSTREAM_METHOD = "DELETE";
const UPSTREAM_ROUTE = "/claims/:evidenceFileId";

export class DeleteEvidenceAdaptor implements DeleteEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async deleteEvidence(
    body: DeleteEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<DeleteEvidenceResponse> {
    const startedAt = Date.now();

    try {
      const response: AxiosResponse = await deleteFromInquestsApi({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/claims/${body.evidenceFileId}`,
        accessToken,
      });

      if (response.status !== HTTP_NO_CONTENT) {
        logger.logWarn({
          functionName: "delete_evidence_adaptor",
          message: "Delete evidence rejected by upstream service",
          extraContext: {
            event: "outbound_api_call",
            operation: OPERATION,
            upstream_status_code: response.status,
          },
        });
        return { status: "DELETE_REJECTED" };
      }

      logger.logInfo({
        functionName: "delete_evidence_adaptor",
        message: "Delete evidence completed successfully",
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
        functionName: "delete_evidence_adaptor",
        message: "Delete evidence failed",
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
