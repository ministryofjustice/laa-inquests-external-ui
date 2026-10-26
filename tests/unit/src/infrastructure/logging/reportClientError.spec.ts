import { assert } from "chai";
import * as Sentry from "@sentry/node";
import { initSentryWithCapturedEvents } from "#tests/unit/helpers/sentryTestClient.js";
import { reportClientError } from "#src/infrastructure/logging/reportClientError.js";

describe("reportClientError", () => {
  let capturedEvents: Array<Record<string, unknown>>;

  beforeEach(() => {
    capturedEvents = initSentryWithCapturedEvents();
  });

  afterEach(async () => {
    await Sentry.close();
  });

  it("sends a error event with the status, event and route as tags", async () => {
    reportClientError({
      message: "Upload validation failed",
      statusCode: 422,
      event: "upload_validation_failed",
      route: "/apply/upload",
      tags: { no_js_upload: false },
    });
    await Sentry.flush();

    assert.equal(capturedEvents.length, 1);
    const [event] = capturedEvents;
    assert.equal(event.message, "Upload validation failed");
    assert.equal(event.level, "error");
    assert.deepInclude(event.tags as Record<string, unknown>, {
      status_code: 422,
      event: "upload_validation_failed",
      route: "/apply/upload",
      no_js_upload: false,
    });
  });

  it("groups occurrences by event and status code", async () => {
    reportClientError({
      message: "Upload validation failed",
      statusCode: 422,
      event: "upload_validation_failed",
      route: "/apply/upload",
    });
    await Sentry.flush();

    assert.deepEqual(capturedEvents[0].fingerprint, [
      "client-error",
      "upload_validation_failed",
      "422",
    ]);
  });

  it("does not leak the scope into later events", async () => {
    reportClientError({
      message: "first",
      statusCode: 422,
      event: "upload_validation_failed",
      route: "/apply/upload",
    });
    Sentry.captureMessage("second");
    await Sentry.flush();

    const second = capturedEvents.find((event) => event.message === "second");
    assert.isDefined(second);
    assert.notProperty(second?.tags ?? {}, "status_code");
  });
});
