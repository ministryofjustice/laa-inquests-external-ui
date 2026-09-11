import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  ClaimSubmitPort,
  SubmitClaimPortResult,
} from "#src/ports/source/inquests-api/SubmitClaim.port.js";
import type { SubmitClaimRequest } from "./models/SubmitClaim.types.js";
import {
  NormalisedSubmitClaimApiErrorSchema,
  SubmitClaimResponseAcceptedSchema,
  SubmitClaimResponseRejectedFallbackSchema,
  SubmitClaimResponseRejectedSchema,
} from "./models/SubmitClaim.schema.js";
import { postToInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { isAxiosErrorWithResponse } from "#src/infrastructure/express/middleware/axios/errors.js";
import { HTTP_UNPROCESSABLE_CONTENT } from "#src/infrastructure/locales/constants.js";
import { logger } from "#src/infrastructure/logging/logger.js";

const OPERATION = "submit_claim";
const UPSTREAM_METHOD = "POST";
const UPSTREAM_ROUTE = "/applications/:laaReference/claim";

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
    const startedAt = Date.now();

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response: AxiosResponse<unknown> = await postToInquestsApi<
        unknown,
        SubmitClaimRequest
      >({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/${laaReference}/claim`,
        body,
        accessToken,
      });

      logger.logInfo({
        functionName: "submit_claim_adaptor",
        message: "Claim submission returned response payload",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });

      const rejectedKnown = SubmitClaimResponseRejectedSchema.safeParse(
        response.data,
      );

      if (rejectedKnown.success) {
        return {
          status: "REJECTED",
          data: {
            claimId: rejectedKnown.data.claimId,
            rejectionReasons: rejectedKnown.data.rejectionReasons,
          },
        };
      }

      const rejectedFallback =
        SubmitClaimResponseRejectedFallbackSchema.safeParse(response.data);

      if (rejectedFallback.success) {
        return {
          status: "REJECTED",
          data: {
            claimId: rejectedFallback.data.claimId,
            rejectionReasons: rejectedFallback.data.rejectionReasons,
          },
        };
      }

      const accepted = SubmitClaimResponseAcceptedSchema.parse(response.data);
      return { status: "CREATED", data: accepted };
    } catch (error) {
      if (
        isAxiosErrorWithResponse(error) &&
        error.response.status === HTTP_UNPROCESSABLE_CONTENT
      ) {
        const parsed = NormalisedSubmitClaimApiErrorSchema.safeParse(
          error.response.data,
        );
        return {
          status: "UNPROCESSABLE",
          errorCode: parsed.success ? parsed.data.errorCode : "",
        };
      }

      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "submit_claim_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
