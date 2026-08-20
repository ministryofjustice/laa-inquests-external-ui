import type { AxiosInstance, AxiosResponse } from "axios";
import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import type {
  DeleteEvidenceRequest,
  DeleteEvidenceResponse,
} from "./models/DeleteEvidence.types.js";
import { DeleteEvidenceResponseSchema } from "./models/DeleteEvidence.schema.js";
import { HTTP_NOT_FOUND } from "#src/infrastructure/locales/constants.js";
import { deleteFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

const HTTP_NO_CONTENT = 204;

export class DeleteEvidenceAdaptor implements DeleteEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async deleteEvidence(
    body: DeleteEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<DeleteEvidenceResponse> {
    try {
      const response: AxiosResponse = await deleteFromInquestsApi({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/claims/${body.evidenceFileId}`,
        accessToken,
      });

      if (response.status !== HTTP_NO_CONTENT) {
        const reason =
          response.status === HTTP_NOT_FOUND
            ? "INVALID_INPUT_STATE"
            : "UPSTREAM_REJECTED";
        logger.logWarn({
          functionName: "deleteEvidenceAdaptor_deleteEvidence",
          message: "Delete evidence request rejected by upstream service",
          extraContext: {
            event: "claim_evidence_delete_failed",
            reason,
            status_code: response.status,
            file_id: body.evidenceFileId,
          },
        });
        return {
          status: "TECHNICAL_FAILURE",
          reason,
        };
      }

      const parsedResponse = DeleteEvidenceResponseSchema.safeParse({
        status: "SUCCESS",
      });

      if (!parsedResponse.success) {
        logger.logError({
          functionName: "deleteEvidenceAdaptor_deleteEvidence",
          message: "Delete evidence returned invalid success payload",
          extraContext: {
            event: "claim_evidence_delete_failed",
            reason: "UNEXPECTED_EXCEPTION",
            issues: parsedResponse.error.issues,
            file_id: body.evidenceFileId,
          },
        });
        return {
          status: "TECHNICAL_FAILURE",
          reason: "UNEXPECTED_EXCEPTION",
        };
      }

      logger.logInfo({
        functionName: "deleteEvidenceAdaptor_deleteEvidence",
        message: "Delete evidence completed successfully",
        extraContext: {
          event: "claim_evidence_delete_completed",
          outcome: "SUCCESS",
          file_id: body.evidenceFileId,
        },
      });

      return {
        status: "SUCCESS",
      };
    } catch (err) {
      logger.logError({
        functionName: "deleteEvidenceAdaptor_deleteEvidence",
        message: "Delete evidence failed with exception",
        err,
        extraContext: {
          event: "claim_evidence_delete_failed",
          reason: "UNEXPECTED_EXCEPTION",
          file_id: body.evidenceFileId,
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
