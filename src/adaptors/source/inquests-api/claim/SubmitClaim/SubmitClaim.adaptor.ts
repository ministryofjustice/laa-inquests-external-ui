import type { AxiosInstance, AxiosResponse } from "axios";
import type { ClaimSubmitPort } from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type {
  SubmitClaimRequest,
  SubmitClaimResponse,
} from "./models/SubmitClaim.types.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";

export class SubmitClaimAdaptor implements ClaimSubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async submitClaim(
    laaReference: string,
    body: SubmitClaimRequest,
    accessToken: string | undefined,
  ): Promise<SubmitClaimResponse> {
    const response: AxiosResponse<SubmitClaimResponse> =
      await postToInquestsApi<SubmitClaimResponse, SubmitClaimRequest>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/${laaReference}/claim`,
        body,
        accessToken,
      });
    return response.data;
  }
}
