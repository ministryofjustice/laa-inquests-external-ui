import type { AxiosInstance, AxiosResponse } from "axios";
import type { Readable } from "node:stream";
import type { DownloadEvidencePort } from "#src/ports/source/inquests-api/DownloadEvidence.port.js";
import type {
  DownloadEvidenceRequest,
  DownloadEvidenceResponse,
} from "./models/DownloadEvidence.types.js";
import {
  HTTP_NOT_FOUND,
  HTTP_OK,
} from "#src/infrastructure/locales/constants.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

export class DownloadEvidenceAdaptor implements DownloadEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async downloadEvidence(
    request: DownloadEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<DownloadEvidenceResponse> {
    try {
      const response: AxiosResponse<Readable> =
        await getFromInquestsApi<Readable>({
          http: this.http,
          baseUrl: this.baseUrl,
          path: `/claims/${request.claimEvidenceId}`,
          params: { disposition: request.disposition },
          accessToken,
          responseType: "stream",
          validateStatus: () => true,
        });

      if (response.status === HTTP_NOT_FOUND) {
        logger.logError({
          functionName: "downloadEvidenceAdaptor_downloadEvidence",
          message: "Evidence file was not found upstream",
          extraContext: {
            event: "claim_evidence_download_failed",
            reason: "NOT_FOUND",
            status_code: response.status,
            file_id: request.claimEvidenceId,
          },
        });
        return { status: "TECHNICAL_FAILURE", reason: "NOT_FOUND" };
      }

      if (response.status !== HTTP_OK) {
        logger.logError({
          functionName: "downloadEvidenceAdaptor_downloadEvidence",
          message: "Evidence download rejected by upstream service",
          extraContext: {
            event: "claim_evidence_download_failed",
            reason: "UPSTREAM_REJECTED",
            status_code: response.status,
            file_id: request.claimEvidenceId,
          },
        });
        return { status: "TECHNICAL_FAILURE", reason: "UPSTREAM_REJECTED" };
      }

      logger.logInfo({
        functionName: "downloadEvidenceAdaptor_downloadEvidence",
        message: "Evidence download retrieved successfully",
        extraContext: {
          event: "claim_evidence_download_completed",
          outcome: "SUCCESS",
          file_id: request.claimEvidenceId,
        },
      });

      return {
        status: "SUCCESS",
        stream: response.data,
        contentType:
          (response.headers["content-type"] as string | undefined) ??
          "application/octet-stream",
        contentDisposition:
          (response.headers["content-disposition"] as string | undefined) ??
          request.disposition,
      };
    } catch (err) {
      logger.logError({
        functionName: "downloadEvidenceAdaptor_downloadEvidence",
        message: "Evidence download failed with exception",
        err,
        extraContext: {
          event: "claim_evidence_download_failed",
          reason: "UNEXPECTED_EXCEPTION",
          file_id: request.claimEvidenceId,
        },
      });
      return { status: "TECHNICAL_FAILURE", reason: "UNEXPECTED_EXCEPTION" };
    }
  }
}
