import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import type { Readable } from "node:stream";
import type { DownloadEvidencePort } from "#src/ports/source/inquests-api/DownloadEvidence.port.js";
import type {
  DownloadEvidenceRequest,
  DownloadEvidenceResponse,
} from "./models/DownloadEvidence.types.js";
import { HTTP_NOT_FOUND } from "#src/infrastructure/locales/constants.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const DEFAULT_CONTENT_TYPE = "application/octet-stream";
const OPERATION = "download_evidence";
const UPSTREAM_METHOD = "GET";
const UPSTREAM_ROUTE = "/claims/:claimEvidenceId";

export class DownloadEvidenceAdaptor implements DownloadEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async downloadEvidence(
    request: DownloadEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<DownloadEvidenceResponse> {
    const startedAt = Date.now();

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response: AxiosResponse<Readable> =
        await getFromInquestsApi<Readable>({
          http: this.http,
          baseUrl: this.baseUrl,
          path: `/claims/${request.claimEvidenceId}`,
          params: { disposition: request.disposition },
          accessToken,
          responseType: "stream",
        });

      logger.logInfo({
        functionName: "download_evidence_adaptor",
        message: "Evidence download retrieved successfully",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });

      return {
        status: "SUCCESS",
        stream: response.data,
        contentType:
          (response.headers["content-type"] as string | undefined) ??
          DEFAULT_CONTENT_TYPE,
        contentDisposition:
          (response.headers["content-disposition"] as string | undefined) ??
          request.disposition,
      };
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === HTTP_NOT_FOUND
      ) {
        logger.logWarn({
          functionName: "download_evidence_adaptor",
          message: "Evidence file was not found upstream",
          extraContext: {
            event: "outbound_api_not_found",
            operation: OPERATION,
            upstream_status_code: HTTP_NOT_FOUND,
          },
        });
        return { status: "NOT_FOUND" };
      }

      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "download_evidence_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
