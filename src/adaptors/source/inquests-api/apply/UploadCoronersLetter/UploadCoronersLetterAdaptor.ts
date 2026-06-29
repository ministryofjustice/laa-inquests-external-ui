import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  UploadCoronersLetterRequest,
  UploadCoronersLetterResponse,
} from "./models/UploadCoronersLetter.types.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";

export class UploadCoronersLetterAdaptor implements UploadCoronersLetterPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async uploadCoronersLetter(
    body: UploadCoronersLetterRequest,
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
      const response: AxiosResponse<{ coronersLetterId: string }> =
        await this.http.post(
          `${this.baseUrl}/applications/upload-coroners-letter`,
          formData,
        );

      if (response.status !== HTTP_CREATED) {
        return {
          status: "TECHNICAL_FAILURE",
          reason: "UPSTREAM_REJECTED",
        };
      }

      return {
        status: "SUCCESS",
        coronersLetterId: response.data.coronersLetterId,
      };
    } catch (error) {
      return {
        status: "TECHNICAL_FAILURE",
        reason: "UNEXPECTED_EXCEPTION",
      };
    }
  }
}
