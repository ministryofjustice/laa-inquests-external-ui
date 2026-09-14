import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export interface RequestContext {
  requestId: string;
  correlationId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  context: RequestContext,
  callback: () => T,
): T {
  return storage.run(context, callback);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

function headerValueToString(
  headerValue: string | string[] | undefined,
): string | undefined {
  if (typeof headerValue === "string") {
    return headerValue;
  }

  if (Array.isArray(headerValue)) {
    const [firstHeaderValue] = headerValue;
    return firstHeaderValue;
  }

  return undefined;
}

type CorrelationHeaders = Record<string, string | string[] | undefined>;

export function buildRequestContext(
  headers: CorrelationHeaders,
): RequestContext {
  const requestId =
    headerValueToString(headers["x-request-id"]) ?? randomUUID();
  const correlationId =
    headerValueToString(headers["x-correlation-id"]) ?? requestId;

  return { requestId, correlationId };
}
