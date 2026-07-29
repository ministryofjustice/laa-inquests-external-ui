import type { AxiosInstance, AxiosResponse } from "axios";
import type { UploadEvidencePort } from "#src/ports/source/inquests-api/UploadEvidence.port.js";
import type {
  UploadEvidenceRequest,
  UploadEvidenceResponse,
} from "./models/UploadEvidence.types.js";
import { UploadEvidenceResponseSchema } from "./models/UploadEvidence.schema.js";
import {
  HTTP_CREATED,
  HTTP_UNPROCESSABLE_CONTENT,
} from "#src/infrastructure/locales/constants.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

export class UploadEvidenceAdaptor implements UploadEvidencePort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async uploadEvidence(
    body: UploadEvidenceRequest,
    accessToken: string | undefined,
  ): Promise<UploadEvidenceResponse> {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([body.buffer as unknown as ArrayBuffer], {
        type: body.mimetype,
      }),
      body.originalname,
    );

    try {
      const response: AxiosResponse<{
        claimEvidenceId: string;
        claimEvidenceFileName: string;
      }> = await postToInquestsApi<
        {
          claimEvidenceId: string;
          claimEvidenceFileName: string;
        },
        FormData
      >({
        http: this.http,
        baseUrl: this.baseUrl,
        path: "/applications/claim/upload-evidence",
        body: formData,
        accessToken,
      });

      if (response.status !== HTTP_CREATED) {
        if (response.status === HTTP_UNPROCESSABLE_CONTENT) {
          return {
            status: "TECHNICAL_FAILURE",
            reason: "FILE_SCAN_FOUND_VIRUS",
          };
        }

        return {
          status: "TECHNICAL_FAILURE",
          reason: "UPSTREAM_REJECTED",
        };
      }

      const parsedResponse = UploadEvidenceResponseSchema.safeParse({
        status: "SUCCESS",
        evidenceFileId: response.data.claimEvidenceId,
        evidenceFileName: response.data.claimEvidenceFileName,
      });

      if (!parsedResponse.success) {
        return {
          status: "TECHNICAL_FAILURE",
          reason: "UNEXPECTED_EXCEPTION",
        };
      }

      return {
        status: "SUCCESS",
        evidenceFileId: parsedResponse.data.evidenceFileId,
        evidenceFileName: parsedResponse.data.evidenceFileName,
      };
    } catch {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
