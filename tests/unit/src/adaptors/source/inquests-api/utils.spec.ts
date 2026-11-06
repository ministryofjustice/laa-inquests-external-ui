import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import {
  buildInquestsApiHeaders,
  deleteFromInquestsApi,
  getFromInquestsApi,
  postToInquestsApi,
} from "#src/adaptors/source/inquests-api/utils.js";
import { runWithRequestContext } from "#src/infrastructure/logging/requestContext.js";

describe("buildInquestsApiHeaders", () => {
  it("includes the request correlation ID when a context is active", () => {
    runWithRequestContext(
      { requestId: "request-123", correlationId: "correlation-456" },
      () => {
        assert.deepEqual(buildInquestsApiHeaders("access-token"), {
          Authorization: "Bearer access-token",
          "x-correlation-id": "correlation-456",
        });
      },
    );
  });

  it("omits correlation headers when no context is active", () => {
    assert.deepEqual(buildInquestsApiHeaders("access-token"), {
      Authorization: "Bearer access-token",
    });
  });
});

describe("Inquests API request helpers", () => {
  let http: StubbedInstance<AxiosInstance>;

  beforeEach(() => {
    http = stubInterface<AxiosInstance>();
    http.get.resolves({ status: 200, data: {} });
    http.post.resolves({ status: 200, data: {} });
    http.delete.resolves({ status: 200, data: {} });
  });

  it("sends the correlation ID with GET requests", async () => {
    await runWithRequestContext(
      { requestId: "request-123", correlationId: "correlation-456" },
      async () => {
        await getFromInquestsApi({
          http,
          baseUrl: "https://inquests-api.test",
          path: "/resource",
          accessToken: "access-token",
        });
      },
    );

    const options = http.get.firstCall.args[1] as {
      headers: Record<string, string>;
    };
    assert.deepEqual(options.headers, {
      Authorization: "Bearer access-token",
      "x-correlation-id": "correlation-456",
    });
  });

  it("sends the correlation ID and caller-supplied headers with POST requests", async () => {
    await runWithRequestContext(
      { requestId: "request-123", correlationId: "correlation-456" },
      async () => {
        await postToInquestsApi({
          http,
          baseUrl: "https://inquests-api.test",
          path: "/resource",
          body: {},
          accessToken: "access-token",
          headers: { "Content-Type": "multipart/form-data" },
        });
      },
    );

    const options = http.post.firstCall.args[2] as {
      headers: Record<string, string>;
    };
    assert.deepEqual(options.headers, {
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer access-token",
      "x-correlation-id": "correlation-456",
    });
  });

  it("sends the correlation ID with DELETE requests", async () => {
    await runWithRequestContext(
      { requestId: "request-123", correlationId: "correlation-456" },
      async () => {
        await deleteFromInquestsApi({
          http,
          baseUrl: "https://inquests-api.test",
          path: "/resource",
          accessToken: "access-token",
        });
      },
    );

    const options = http.delete.firstCall.args[1] as {
      headers: Record<string, string>;
    };
    assert.deepEqual(options.headers, {
      Authorization: "Bearer access-token",
      "x-correlation-id": "correlation-456",
    });
  });
});
