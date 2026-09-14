import type { AxiosInstance, AxiosResponse } from "axios";
import type { UploadEvidencePort } from "#src/ports/source/inquests-api/UploadEvidence.port.js";
import type {
  UploadEvidenceRequest,
  UploadEvidenceResponse,
} from "./models/UploadEvidence.types.js";
import { UploadEvidenceApiResponseSchema } from "./models/UploadEvidence.schema.js";
import {
  HTTP_CREATED,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const OPERATION = "upload_evidence";
const UPSTREAM_METHOD = "POST";
const UPSTREAM_ROUTE = "/claims/evidence";

export class UploadEvidenceAdaptor implements UploadEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async uploadEvidence(
    body: UploadEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<UploadEvidenceResponse> {
    const startedAt = Date.now();
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([body.buffer as unknown as ArrayBuffer], {
        type: body.mimetype,
      }),
      body.originalname,
    );

    try {
      const response: AxiosResponse<unknown> = await postToInquestsApi<
        unknown,
        FormData
      >({
        http: this.http,
        baseUrl: this.baseUrl,
        path: UPSTREAM_ROUTE,
        body: formData,
        accessToken,
        validateStatus: () => true,
      });

      if (response.status === HTTP_CREATED) {
        const parsed = UploadEvidenceApiResponseSchema.safeParse(response.data);

        if (
          !parsed.success ||
          parsed.data.claimEvidenceId === "" ||
          parsed.data.claimEvidenceFileName === ""
        ) {
          this.#logRejected(
            "Evidence upload returned malformed success payload",
            {
              upstream_status_code: response.status,
            },
          );
          return { status: "UPLOAD_REJECTED" };
        }

        logger.logInfo({
          functionName: "upload_evidence_adaptor",
          message: "Evidence upload completed successfully",
          extraContext: {
            event: "outbound_api_call",
            operation: OPERATION,
            upstream_method: UPSTREAM_METHOD,
            upstream_route: UPSTREAM_ROUTE,
            duration_ms: Date.now() - startedAt,
            file_id: parsed.data.claimEvidenceId,
          },
        });

        return {
          status: "SUCCESS",
          evidenceFileId: parsed.data.claimEvidenceId,
          evidenceFileName: parsed.data.claimEvidenceFileName,
        };
      }

      if (response.status === HTTP_UNPROCESSABLE_CONTENT) {
        logger.logWarn({
          functionName: "upload_evidence_adaptor",
          message: "Evidence upload rejected by file scan",
          extraContext: {
            event: "outbound_api_call",
            operation: OPERATION,
            upstream_status_code: response.status,
          },
        });
        return { status: "FILE_SCAN_FOUND_VIRUS" };
      }

      this.#logRejected("Evidence upload rejected by upstream service", {
        upstream_status_code: response.status,
      });
      return { status: "UPLOAD_REJECTED" };
    } catch (error) {
      logger.logError({
        functionName: "upload_evidence_adaptor",
        message: "Evidence upload failed",
        err: error,
        extraContext: {
          event: "outbound_api_request_failed",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });
      return { status: "UPLOAD_REJECTED" };
    }
  }

  #logRejected(message: string, extra: Record<string, unknown>): void {
    logger.logWarn({
      functionName: "upload_evidence_adaptor",
      message,
      extraContext: {
        event: "outbound_api_call",
        operation: OPERATION,
        ...extra,
      },
    });
  }
}
