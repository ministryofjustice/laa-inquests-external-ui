import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  UploadCoronersLetterRequest,
  UploadCoronersLetterResponse,
} from "./models/UploadCoronersLetter.types.js";
import {
  HTTP_CREATED,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";

interface UploadCoronersLetterApiResponse {
  coronersLetterId: string;
  coronersLetterFileName: string;
}

export class UploadCoronersLetterAdaptor implements UploadCoronersLetterPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async uploadCoronersLetter(
    body: UploadCoronersLetterRequest,
    accessToken: string | undefined,
  ): Promise<UploadCoronersLetterResponse> {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([body.buffer as unknown as ArrayBuffer], {
        type: body.mimetype,
      }),
      body.originalname,
    );

    try {
      const response: AxiosResponse<UploadCoronersLetterApiResponse> =
        await postToInquestsApi<UploadCoronersLetterApiResponse, FormData>({
          http: this.http,
          baseUrl: this.baseUrl,
          path: "/applications/upload-coroners-letter",
          body: formData,
          accessToken,
          validateStatus: () => true,
        });

      if (response.status !== HTTP_CREATED) {
        if (response.status === HTTP_UNPROCESSABLE_CONTENT) {
          logger.logWarn({
            functionName: "uploadCoronersLetterAdaptor_uploadCoronersLetter",
            message: "Coroners letter upload rejected due to failed file scan",
            extraContext: {
              event: "apply_coroners_letter_upload_failed",
              reason: "FILE_SCAN_FOUND_VIRUS",
              status_code: response.status,
            },
          });
          return {
            status: "TECHNICAL_FAILURE",
            reason: "FILE_SCAN_FOUND_VIRUS",
          };
        } else {
          logger.logWarn({
            functionName: "uploadCoronersLetterAdaptor_uploadCoronersLetter",
            message: "Coroners letter upload rejected by upstream service",
            extraContext: {
              event: "apply_coroners_letter_upload_failed",
              reason: "UPSTREAM_REJECTED",
              status_code: response.status,
            },
          });
          return {
            status: "TECHNICAL_FAILURE",
            reason: "UPSTREAM_REJECTED",
          };
        }
      }

      logger.logInfo({
        functionName: "uploadCoronersLetterAdaptor_uploadCoronersLetter",
        message: "Coroners letter upload completed successfully",
        extraContext: {
          event: "apply_coroners_letter_upload_completed",
          outcome: "SUCCESS",
          file_id: response.data.coronersLetterId,
        },
      });

      return {
        status: "SUCCESS",
        coronersLetterId: response.data.coronersLetterId,
        coronersLetterFileName: response.data.coronersLetterFileName,
      };
    } catch (err) {
      logger.logError({
        functionName: "uploadCoronersLetterAdaptor_uploadCoronersLetter",
        message: "Coroners letter upload failed with exception",
        err,
        extraContext: {
          event: "apply_coroners_letter_upload_failed",
          reason: "UNEXPECTED_EXCEPTION",
        },
      });
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
