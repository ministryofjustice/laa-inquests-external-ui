import { strict as assert } from "assert";
import sinon from "sinon";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  classifyFailure,
  translateInquestsApiError,
  MissingAccessTokenError,
} from "#src/adaptors/source/inquests-api/errorTranslation.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";

function axiosErrorWith(options: { status?: number; code?: string }): unknown {
  return Object.assign(new Error("upstream failure"), {
    isAxiosError: true,
    code: options.code,
    response:
      options.status === undefined ? undefined : { status: options.status },
  });
}

describe("errorTranslation", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("classifyFailure", () => {
    it("classifies a missing access token as missing_credentials", () => {
      const result = classifyFailure(new MissingAccessTokenError());
      assert.equal(result.failure_type, "missing_credentials");
      assert.equal(result.retryable, false);
    });

    it("classifies a 401 as unauthenticated", () => {
      const result = classifyFailure(axiosErrorWith({ status: 401 }));
      assert.equal(result.failure_type, "unauthenticated");
      assert.equal(result.retryable, false);
      assert.equal(result.upstream_status_code, 401);
    });

    it("classifies a 403 as forbidden", () => {
      const result = classifyFailure(axiosErrorWith({ status: 403 }));
      assert.equal(result.failure_type, "forbidden");
      assert.equal(result.retryable, false);
    });

    it("classifies a timeout code as retryable timeout", () => {
      const result = classifyFailure(axiosErrorWith({ code: "ETIMEDOUT" }));
      assert.equal(result.failure_type, "timeout");
      assert.equal(result.retryable, true);
    });

    it("classifies a response-less axios error as retryable network", () => {
      const result = classifyFailure(axiosErrorWith({ code: "ECONNREFUSED" }));
      assert.equal(result.failure_type, "network");
      assert.equal(result.retryable, true);
    });

    it("classifies a 5xx as retryable upstream_5xx", () => {
      const result = classifyFailure(axiosErrorWith({ status: 503 }));
      assert.equal(result.failure_type, "upstream_5xx");
      assert.equal(result.retryable, true);
    });

    it("classifies a non-auth 4xx as upstream_4xx", () => {
      const result = classifyFailure(axiosErrorWith({ status: 409 }));
      assert.equal(result.failure_type, "upstream_4xx");
      assert.equal(result.retryable, false);
    });

    it("classifies a non-axios error as invalid_response", () => {
      const result = classifyFailure(new Error("bad payload"));
      assert.equal(result.failure_type, "invalid_response");
      assert.equal(result.retryable, false);
    });
  });

  describe("translateInquestsApiError", () => {
    it("logs the failure once with safe transport metadata", () => {
      const logSpy = sinon.spy(logger, "logError");
      const error = axiosErrorWith({ status: 503, code: "ERR_BAD_RESPONSE" });

      translateInquestsApiError({
        error,
        operation: "get_public_bodies",
        functionName: "get_public_authorities_adaptor",
        upstreamMethod: "GET",
        upstreamRoute: "/applications/public-bodies",
        startedAt: Date.now(),
      });

      assert.equal(logSpy.callCount, 1);
      const [logArgs] = logSpy.firstCall.args;
      assert.equal(logArgs.functionName, "get_public_authorities_adaptor");
      assert.equal(logArgs.extraContext?.event, "outbound_api_request_failed");
      assert.equal(logArgs.extraContext?.operation, "get_public_bodies");
      assert.equal(logArgs.extraContext?.upstream_method, "GET");
      assert.equal(
        logArgs.extraContext?.upstream_route,
        "/applications/public-bodies",
      );
      assert.equal(logArgs.extraContext?.failure_type, "upstream_5xx");
      assert.equal(logArgs.extraContext?.retryable, true);
      assert.equal(typeof logArgs.extraContext?.duration_ms, "number");
    });

    it("returns a sanitized ApplicationError with no axios cause", () => {
      sinon.stub(logger, "logError");
      const error = axiosErrorWith({ status: 401 });

      const result = translateInquestsApiError({
        error,
        operation: "get_public_bodies",
        functionName: "get_public_authorities_adaptor",
        upstreamMethod: "GET",
        upstreamRoute: "/applications/public-bodies",
        startedAt: Date.now(),
      });

      assert.ok(result instanceof ApplicationError);
      assert.equal(
        result.type,
        APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
      );
      assert.equal(result.operation, "get_public_bodies");
      assert.equal((result as { cause?: unknown }).cause, undefined);
    });

    it("maps a forbidden failure to FORBIDDEN", () => {
      sinon.stub(logger, "logError");

      const result = translateInquestsApiError({
        error: axiosErrorWith({ status: 403 }),
        operation: "get_public_bodies",
        functionName: "get_public_authorities_adaptor",
        upstreamMethod: "GET",
        upstreamRoute: "/applications/public-bodies",
        startedAt: Date.now(),
      });

      assert.equal(result.type, APPLICATION_ERROR_TYPES.FORBIDDEN);
    });

    it("maps a malformed payload to INVALID_UPSTREAM_RESPONSE", () => {
      sinon.stub(logger, "logError");

      const result = translateInquestsApiError({
        error: new Error("zod parse failure"),
        operation: "get_public_bodies",
        functionName: "get_public_authorities_adaptor",
        upstreamMethod: "GET",
        upstreamRoute: "/applications/public-bodies",
        startedAt: Date.now(),
      });

      assert.equal(
        result.type,
        APPLICATION_ERROR_TYPES.INVALID_UPSTREAM_RESPONSE,
      );
    });
  });
});
