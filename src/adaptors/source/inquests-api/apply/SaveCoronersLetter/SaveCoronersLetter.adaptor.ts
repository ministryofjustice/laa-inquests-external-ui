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
    _body: SaveCoronersLetterRequest,
  ): Promise<SaveCoronersLetterResponse> {
    const response: AxiosResponse<SaveCoronersLetterResponse> =
      await this.http.post(
        `${this.baseUrl}/applications/save_coroners_letter`,
        _body,
      );

    return {
      statusCode: response.status,
    };
  }
}
