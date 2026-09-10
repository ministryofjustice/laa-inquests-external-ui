import axios, { type AxiosError } from "axios";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
  type ApplicationErrorType,
} from "#src/use-cases/common/ApplicationError.js";
import {
  HTTP_UNAUTHORIZED,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
} from "#src/infrastructure/locales/constants.js";

// Thrown by an outbound adapter when it has no access token to present to the
// upstream service. Kept in this module so translation classifies it without
// inspecting error message strings.
export class MissingAccessTokenError extends Error {
  constructor() {
    super("Missing access token for Inquests API request");
    this.name = "MissingAccessTokenError";
  }
}

export type FailureType =
  | "missing_credentials"
  | "unauthenticated"
  | "forbidden"
  | "timeout"
  | "network"
  | "upstream_4xx"
  | "upstream_5xx"
  | "invalid_response";

interface FailureDiagnostics {
  failure_type: FailureType;
  retryable: boolean;
  upstream_status_code?: number;
  axios_code?: string;
}

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

export function classifyFailure(error: unknown): FailureDiagnostics {
  if (error instanceof MissingAccessTokenError) {
    return { failure_type: "missing_credentials", retryable: false };
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    if (status === HTTP_UNAUTHORIZED) {
      return {
        failure_type: "unauthenticated",
        retryable: false,
        upstream_status_code: status,
        axios_code: axiosError.code,
      };
    }
    if (status === HTTP_FORBIDDEN) {
      return {
        failure_type: "forbidden",
        retryable: false,
        upstream_status_code: status,
        axios_code: axiosError.code,
      };
    }
    if (axiosError.code !== undefined && TIMEOUT_CODES.has(axiosError.code)) {
      return {
        failure_type: "timeout",
        retryable: true,
        axios_code: axiosError.code,
      };
    }
    if (status === undefined) {
      return {
        failure_type: "network",
        retryable: true,
        axios_code: axiosError.code,
      };
    }
    if (status >= HTTP_INTERNAL_SERVER_ERROR) {
      return {
        failure_type: "upstream_5xx",
        retryable: true,
        upstream_status_code: status,
        axios_code: axiosError.code,
      };
    }
    return {
      failure_type: "upstream_4xx",
      retryable: false,
      upstream_status_code: status,
      axios_code: axiosError.code,
    };
  }

  // Non-Axios errors reaching here are treated as an invalid upstream response
  // (e.g. a Zod schema failure while parsing the payload).
  return { failure_type: "invalid_response", retryable: false };
}

const APPLICATION_ERROR_TYPE_BY_FAILURE: Record<
  FailureType,
  ApplicationErrorType
> = {
  missing_credentials: APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
  unauthenticated: APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
  forbidden: APPLICATION_ERROR_TYPES.FORBIDDEN,
  timeout: APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
  network: APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
  upstream_5xx: APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
  upstream_4xx: APPLICATION_ERROR_TYPES.UPSTREAM_REJECTED,
  invalid_response: APPLICATION_ERROR_TYPES.INVALID_UPSTREAM_RESPONSE,
};

interface TranslateInquestsApiErrorParams {
  error: unknown;
  operation: string;
  functionName: string;
  upstreamMethod: string;
  upstreamRoute: string;
  startedAt: number;
}

// The single place an Inquests API failure is logged with full transport
// detail. Returns a sanitized ApplicationError carrying no SDK/Axios object.
export function translateInquestsApiError(
  params: TranslateInquestsApiErrorParams,
): ApplicationError {
  const { error, operation, functionName, upstreamMethod, upstreamRoute } =
    params;
  const diagnostics = classifyFailure(error);

  logger.logError({
    functionName,
    message: "Inquests API request failed",
    err: error,
    extraContext: {
      event: "outbound_api_request_failed",
      operation,
      upstream_method: upstreamMethod,
      upstream_route: upstreamRoute,
      duration_ms: Date.now() - params.startedAt,
      ...diagnostics,
    },
  });

  return new ApplicationError(
    APPLICATION_ERROR_TYPE_BY_FAILURE[diagnostics.failure_type],
    operation,
    diagnostics.retryable,
  );
}
