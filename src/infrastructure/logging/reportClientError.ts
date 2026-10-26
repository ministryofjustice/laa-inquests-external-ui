import * as Sentry from "@sentry/node";

interface ClientErrorReport {
  message: string;
  statusCode: number;
  event: string;
  route: string;
  // Only non-identifying values: no file names, form input or validation text.
  tags?: Record<string, string | number | boolean>;
}

/**
 * Reports a 4xx the app answers deliberately (so it never reaches the Express
 * error handler) to Sentry as a error, grouped by event and status code.
 */
export const reportClientError = ({
  message,
  statusCode,
  event,
  route,
  tags = {},
}: ClientErrorReport): void => {
  Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTags({ ...tags, status_code: statusCode, event, route });
    scope.setFingerprint(["client-error", event, String(statusCode)]);
    Sentry.captureMessage(message);
  });
};
