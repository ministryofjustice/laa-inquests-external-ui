import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  SaveCoronersLetterRequest,
  SaveCoronersLetterResponse,
} from "./models/SaveCoronersLetter.types.js";

export class SaveCoronersLetterAdaptor implements SaveCoronersLetterPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async saveCoronersLetter(
    body: SaveCoronersLetterRequest,
  ): Promise<SaveCoronersLetterResponse> {
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
      statusCode: response.status,
      fileId: response.data.fileId,
    };
  }
}
