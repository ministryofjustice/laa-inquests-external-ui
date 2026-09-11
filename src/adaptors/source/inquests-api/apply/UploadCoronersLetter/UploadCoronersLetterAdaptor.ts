import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  UploadCoronersLetterRequest,
  UploadCoronersLetterResponse,
} from "./models/UploadCoronersLetter.types.js";
import { UploadCoronersLetterApiResponseSchema } from "./models/UploadCoronersLetter.schema.js";
import {
  HTTP_CREATED,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const OPERATION = "upload_coroners_letter";
const UPSTREAM_METHOD = "POST";
const UPSTREAM_ROUTE = "/applications/upload-coroners-letter";

export class UploadCoronersLetterAdaptor implements UploadCoronersLetterPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async uploadCoronersLetter(
    body: UploadCoronersLetterRequest,
    accessToken: string | undefined,
  ): Promise<UploadCoronersLetterResponse> {
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
        const parsed = UploadCoronersLetterApiResponseSchema.safeParse(
          response.data,
        );

        if (
          !parsed.success ||
          parsed.data.coronersLetterId === "" ||
          parsed.data.coronersLetterFileName === ""
        ) {
          this.#logRejected("Upload returned malformed success payload", {
            upstream_status_code: response.status,
          });
          return { status: "UPLOAD_REJECTED" };
        }

        logger.logInfo({
          functionName: "upload_coroners_letter_adaptor",
          message: "Coroners letter upload completed successfully",
          extraContext: {
            event: "outbound_api_call",
            operation: OPERATION,
            upstream_method: UPSTREAM_METHOD,
            upstream_route: UPSTREAM_ROUTE,
            duration_ms: Date.now() - startedAt,
            file_id: parsed.data.coronersLetterId,
          },
        });

        return {
          status: "SUCCESS",
          coronersLetterId: parsed.data.coronersLetterId,
          coronersLetterFileName: parsed.data.coronersLetterFileName,
        };
      }

      if (response.status === HTTP_UNPROCESSABLE_CONTENT) {
        logger.logWarn({
          functionName: "upload_coroners_letter_adaptor",
          message: "Coroners letter upload rejected by file scan",
          extraContext: {
            event: "outbound_api_call",
            operation: OPERATION,
            upstream_status_code: response.status,
          },
        });
        return { status: "FILE_SCAN_FOUND_VIRUS" };
      }

      this.#logRejected("Upload rejected by upstream service", {
        upstream_status_code: response.status,
      });
      return { status: "UPLOAD_REJECTED" };
    } catch (error) {
      logger.logError({
        functionName: "upload_coroners_letter_adaptor",
        message: "Coroners letter upload failed",
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
      functionName: "upload_coroners_letter_adaptor",
      message,
      extraContext: {
        event: "outbound_api_call",
        operation: OPERATION,
        ...extra,
      },
    });
  }
}
