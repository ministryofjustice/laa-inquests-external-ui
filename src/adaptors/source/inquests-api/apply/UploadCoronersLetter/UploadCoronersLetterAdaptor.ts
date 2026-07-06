import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  UploadCoronersLetterRequest,
  UploadCoronersLetterResponse,
} from "./models/UploadCoronersLetter.types.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

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
        });

      if (response.status !== HTTP_CREATED) {
        return {
          status: "TECHNICAL_FAILURE",
          reason: "UPSTREAM_REJECTED",
        };
      }

      return {
        status: "SUCCESS",
        coronersLetterId: response.data.coronersLetterId,
        coronersLetterFileName: response.data.coronersLetterFileName,
      };
    } catch (error) {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
