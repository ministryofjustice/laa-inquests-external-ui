import * as Sentry from "@sentry/node";

const TEST_DSN = "https://key@o0.ingest.sentry.io/1";

/** Initialises Sentry with a transport that records events instead of sending them. */
export const initSentryWithCapturedEvents = (): Array<
  Record<string, unknown>
> => {
  const capturedEvents: Array<Record<string, unknown>> = [];
  Sentry.init({
    dsn: TEST_DSN,
    transport: () => ({
      send: async (envelope) => {
        const [, items] = envelope;
        for (const [header, payload] of items) {
          if ((header as { type: string }).type === "event") {
            capturedEvents.push(payload as Record<string, unknown>);
          }
        }
        return await Promise.resolve({});
      },
      flush: async () => await Promise.resolve(true),
    }),
  });
  return capturedEvents;
};
