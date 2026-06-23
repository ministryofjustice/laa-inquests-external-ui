import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  UploadCoronersLetterRequest,
  UploadCoronersLetterResponse,
} from "./models/UploadCoronersLetter.types.js";

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

    const response: AxiosResponse<{ fileId: string }> = await this.http.post(
      `${this.baseUrl}/applications/upload-coroners-letter`,
      formData,
    );

    return {
      status: "SUCCESS",
      fileId: response.data.fileId,
    };
  }
}
