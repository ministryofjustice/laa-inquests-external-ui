import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  ClaimSubmitPort,
  SubmitClaimPortResult,
} from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type {
  SubmitClaimRequest,
  SubmitClaimResponse,
} from "./models/SubmitClaim.types.js";
import { SubmitClaimApiErrorSchema } from "./models/SubmitClaim.schema.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import { isAxiosErrorWithResponse } from "#src/infrastructure/express/middleware/axios/errors.js";
import { HTTP_UNPROCESSABLE_CONTENT } from "#src/infrastructure/locales/constants.js";

export class SubmitClaimAdaptor implements ClaimSubmitPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async submitClaim(
    laaReference: string,
    body: SubmitClaimRequest,
    accessToken: string | undefined,
  ): Promise<SubmitClaimPortResult> {
    try {
      const response: AxiosResponse<SubmitClaimResponse> =
        await postToInquestsApi<SubmitClaimResponse, SubmitClaimRequest>({
          http: this.http,
          baseUrl: this.baseUrl,
          path: `/applications/${laaReference}/claim`,
          body,
          accessToken,
        });
      return { status: "CREATED", data: response.data };
    } catch (error) {
      if (
        isAxiosErrorWithResponse(error) &&
        error.response.status === HTTP_UNPROCESSABLE_CONTENT
      ) {
        const parsed = SubmitClaimApiErrorSchema.safeParse(error.response.data);
        return {
          status: "UNPROCESSABLE",
          errorCode: parsed.success ? parsed.data.errorCode : "",
        };
      }
      throw error;
    }
  }
}
