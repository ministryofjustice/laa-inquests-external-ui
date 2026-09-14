import { strict as assert } from "assert";
import sinon from "sinon";
import config from "#src/infrastructure/config/config.js";
import {
  buildRequestContext,
  getRequestContext,
  runWithRequestContext,
} from "#src/infrastructure/logging/requestContext.js";
import { Logger } from "#src/infrastructure/logging/logger.js";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe("request context", () => {
  it("returns undefined outside a request context", () => {
    assert.equal(getRequestContext(), undefined);
  });

  it("exposes the context synchronously inside a run", () => {
    runWithRequestContext({ requestId: "r1", correlationId: "c1" }, () => {
      assert.deepEqual(getRequestContext(), {
        requestId: "r1",
        correlationId: "c1",
      });
    });
  });

  it("propagates the context across awaits", async () => {
    await runWithRequestContext(
      { requestId: "r1", correlationId: "c1" },
      async () => {
        await Promise.resolve();
        await delay(1);
        assert.deepEqual(getRequestContext(), {
          requestId: "r1",
          correlationId: "c1",
        });
      },
    );
  });

  it("isolates context between concurrent requests", async () => {
    const seen: Record<string, string | undefined> = {};

    await Promise.all([
      runWithRequestContext(
        { requestId: "r1", correlationId: "c1" },
        async () => {
          await delay(10);
          seen.first = getRequestContext()?.requestId;
        },
      ),
      runWithRequestContext(
        { requestId: "r2", correlationId: "c2" },
        async () => {
          await delay(5);
          seen.second = getRequestContext()?.requestId;
        },
      ),
    ]);

    assert.equal(seen.first, "r1");
    assert.equal(seen.second, "r2");
  });
});

describe("buildRequestContext", () => {
  it("uses the request and correlation headers when present", () => {
    const context = buildRequestContext({
      "x-request-id": "req-123",
      "x-correlation-id": "cor-456",
    });

    assert.deepEqual(context, {
      requestId: "req-123",
      correlationId: "cor-456",
    });
  });

  it("falls back to the request id for correlation when missing", () => {
    const context = buildRequestContext({ "x-request-id": "req-123" });

    assert.equal(context.requestId, "req-123");
    assert.equal(context.correlationId, "req-123");
  });

  it("generates an id when no headers are present", () => {
    const context = buildRequestContext({});

    assert.equal(typeof context.requestId, "string");
    assert.notEqual(context.requestId, "");
    assert.equal(context.correlationId, context.requestId);
  });

  it("uses the first value of an array header", () => {
    const context = buildRequestContext({
      "x-request-id": ["req-1", "req-2"],
    });

    assert.equal(context.requestId, "req-1");
  });
});

describe("logger correlation via async context", () => {
  let originalEnvironment: string;
  let logSpy: sinon.SinonSpy;

  beforeEach(() => {
    originalEnvironment = config.app.environment;
    config.app.environment = "prod";
    logSpy = sinon.spy(console, "log");
  });

  afterEach(() => {
    config.app.environment = originalEnvironment;
    logSpy.restore();
  });

  it("uses async context ids when no request is passed", () => {
    const subject = new Logger("debug");

    runWithRequestContext(
      { requestId: "ctx-req", correlationId: "ctx-cor" },
      () => {
        subject.logInfo({ functionName: "fn", message: "m" });
      },
    );

    const [rawOutput] = logSpy.firstCall.args as [string];
    const output = JSON.parse(rawOutput) as Record<string, unknown>;
    assert.equal(output.request_id, "ctx-req");
    assert.equal(output.correlation_id, "ctx-cor");
  });

  it("prefers an explicit request over the async context", () => {
    const subject = new Logger("debug");

    runWithRequestContext(
      { requestId: "ctx-req", correlationId: "ctx-cor" },
      () => {
        subject.logInfo({
          functionName: "fn",
          message: "m",
          request: {
            headers: {
              "x-request-id": "header-req",
              "x-correlation-id": "header-cor",
            },
          } as never,
        });
      },
    );

    const [rawOutput] = logSpy.firstCall.args as [string];
    const output = JSON.parse(rawOutput) as Record<string, unknown>;
    assert.equal(output.request_id, "header-req");
    assert.equal(output.correlation_id, "header-cor");
  });
});
