import type { AxiosInstance } from "axios";
import type { ListClaimsPort } from "#src/ports/source/inquests-api/ListClaims.port.js";
import type { ListClaimsResponse } from "./models/ListClaims.types.js";
import { getFromInquestsApi } from "#src/adaptors/source/inquests-api/utils.js";
import {
  MissingAccessTokenError,
  translateInquestsApiError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { ListClaimsResponseSchema } from "./models/ListClaims.schema.js";

const OPERATION = "list_claims";
const UPSTREAM_METHOD = "GET";
const UPSTREAM_ROUTE = "/applications/:laaReference/claims";

export class ListClaimsAdaptor implements ListClaimsPort {
  constructor(
    private readonly http: AxiosInstance,
    private readonly baseUrl: string,
  ) {}

  async listClaims(
    laaReference: string,
    assessed: boolean,
    accessToken: string | undefined,
  ): Promise<ListClaimsResponse> {
    const startedAt = Date.now();

    try {
      if (typeof accessToken !== "string" || accessToken === "") {
        throw new MissingAccessTokenError();
      }

      const response = await getFromInquestsApi<ListClaimsResponse>({
        http: this.http,
        baseUrl: this.baseUrl,
        path: `/applications/${laaReference}/claims`,
        params: { assessed: String(assessed) },
        accessToken,
      });

      const claims = ListClaimsResponseSchema.parse(response.data);

      logger.logInfo({
        functionName: "list_claims_adaptor",
        message: "Claim list returned response payload",
        extraContext: {
          event: "outbound_api_call",
          operation: OPERATION,
          upstream_method: UPSTREAM_METHOD,
          upstream_route: UPSTREAM_ROUTE,
          duration_ms: Date.now() - startedAt,
        },
      });

      return claims;
    } catch (error) {
      throw translateInquestsApiError({
        error,
        operation: OPERATION,
        functionName: "list_claims_adaptor",
        upstreamMethod: UPSTREAM_METHOD,
        upstreamRoute: UPSTREAM_ROUTE,
        startedAt,
      });
    }
  }
}
