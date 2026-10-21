import type { ErrorEvent, EventHint, NodeOptions } from "@sentry/node";
import config from "#src/infrastructure/config/config.js";

type SpanData = Record<string, unknown>;
type StreamedSpan = Parameters<NonNullable<NodeOptions["beforeSendSpan"]>>[0];

const FILTERED = "[Filtered]";

// Node/Redis/Axios connection errors put the remote address directly into
// `error.message` (e.g. "connect ECONNREFUSED 10.1.2.3:443"). Nothing else in
// this config can reach that text, so it needs its own redaction.
const REDACTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/gv, "[IP]"],
];

export const redactText = (text: string): string =>
  REDACTIONS.reduce(
    (redacted, [pattern, replacement]) =>
      redacted.replace(pattern, replacement),
    text,
  );

// -- URL helpers: only this app's own API keeps its path; every other host
// (MSAL, anything else) can carry tenant ids or signatures in the path --

const parseUrl = (url: string): URL | undefined => {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

const isApiUrl = (url: string): boolean => {
  const apiHost = parseUrl(config.INQUESTS_API_URL)?.host;
  return apiHost !== undefined && parseUrl(url)?.host === apiHost;
};

const scrubUrl = (url: string, keepPath: boolean): string => {
  const parsed = parseUrl(url);
  if (parsed === undefined) {
    return FILTERED;
  }

  const origin = `${parsed.protocol}//${parsed.host}`;
  return keepPath ? `${origin}${parsed.pathname}` : origin;
};

// Query strings and fragments never reach here: dataCollection.urlQueryParams
// is off, so the SDK never collects them in the first place.
const scrubUrlData = (data: SpanData, keepPath: boolean): void => {
  const { "url.full": url } = data;
  if (typeof url === "string") {
    data["url.full"] = scrubUrl(url, keepPath);
  }

  if (!keepPath) {
    delete data["url.path"];
  }
};

// -- Error event scrubbing --

// Query string, cookies, headers and body never reach here: dataCollection
// turns their collection off entirely, so there is nothing left to delete.
// The inbound request's query string has no dataCollection flag though, so
// it is dropped here explicitly.
const scrubRequest = (event: ErrorEvent): void => {
  const { request } = event;
  if (typeof request?.url === "string") {
    request.url = scrubUrl(request.url, true);
  }
};

// Closes the same gap for error events that scrubSpan closes for traces.
const scrubTraceContext = (event: ErrorEvent): void => {
  const traceData = event.contexts?.trace?.data;
  if (traceData !== undefined) {
    scrubUrlData(traceData, true);
  }
};

const sanitizeExceptions = (event: ErrorEvent): void => {
  event.exception?.values?.forEach((exception) => {
    if (exception.value !== undefined) {
      exception.value = redactText(exception.value);
    }
  });
};

export const scrubEvent = (event: ErrorEvent, _hint: EventHint): ErrorEvent => {
  scrubRequest(event);
  scrubTraceContext(event);
  if (event.message !== undefined) {
    event.message = redactText(event.message);
  }

  sanitizeExceptions(event);
  return event;
};

// -- Span scrubbing --

export const scrubSpan = (span: StreamedSpan): StreamedSpan => {
  const { attributes } = span;
  const isOutbound = attributes["sentry.op"] === "http.client";
  const { "url.full": url } = attributes;
  const keepPath = !isOutbound || (typeof url === "string" && isApiUrl(url));

  scrubUrlData(attributes, keepPath);

  if (isOutbound) {
    // "GET https://host/path" keeps the sanitized path for our own API and
    // only the host otherwise. A bare path has no known host, so it is dropped.
    const separator = span.name.indexOf(" ");
    if (separator !== -1) {
      const method = span.name.slice(0, separator);
      const target = span.name.slice(separator + 1);
      if (target.includes("://")) {
        span.name = `${method} ${scrubUrl(target, isApiUrl(target))}`;
      } else if (target.startsWith("/")) {
        span.name = method;
      }
    }
  }

  return span;
};
