# Logging Implementation Plan - laa-inquests-external-ui

Last updated: 2026-08-14

## Goal

Implement structured, consistent, safe logging in `laa-inquests-external-ui` with the same level behavior as `laa-inquests-internal-ui`, and enough detail for an implementation agent to execute directly.

## Non-negotiable decisions

- Use the cross-repo structured logging contract.
- Set `LOG_LEVEL` from env var (Helm values in deployed environments).
- Logger level handling must match internal UI exactly.
- Use request/header-generated tracing ids, not token-substring-derived ids.
- Never log session blobs, raw auth artifacts, free-text payloads, or PII.

## Log level policy

`LOG_LEVEL` allowed values: `debug`, `info`, `warn`, `error`, `fatal`.

Environment defaults:

- Local: `debug`
- Dev: `info`
- Staging: `info`
- Prod: `warn`

Usage rules:

- `debug`: temporary low-level diagnostics; no prod default.
- `info`: normal user journey and business milestone events.
- `warn`: recoverable flow issues and upstream retries/timeouts.
- `error`: request or business flow failure requiring action.
- `fatal`: unrecoverable application state.

## Environment configuration contract

- Read/validate `LOG_LEVEL` at startup with `info` fallback.
- Set via Helm values in environment-specific deploy config.

Example Helm shape:

```yaml
# values-dev.yaml
env:
  LOG_LEVEL: info

# values-prod.yaml
env:
  LOG_LEVEL: warn
```

```yaml
# templates/deployment.yaml
env:
  - name: LOG_LEVEL
	value: {{ .Values.env.LOG_LEVEL | quote }}
```

## Layer-by-layer approach with canonical examples

Use these examples as target code shape.

### 1) Entrypoint / App

Source anchor: `laa-inquests-external-ui/src/app.ts`

```typescript
app.use(requestContextMiddleware);
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () =>
    logger.logDebug("http_request_completed", "Request completed", req, {
      route: req.route?.path ?? req.path,
      method: req.method,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt,
    }),
  );
  next();
});
```

Events: `http_request_completed`.

### 2) Middleware

Source anchor: `laa-inquests-external-ui/src/infrastructure/express/middleware/logger/logger.ts`

```typescript
const configuredLevel = getConfiguredLogLevel();
const requestId = req.get("x-request-id") ?? randomUUID();
const correlationId = req.get("x-correlation-id") ?? requestId;
const context = { requestId, correlationId, userId: req.session.userId };

if (shouldLog("info", configuredLevel)) {
  console.log(buildMessage(functionName, message, "info", context));
}
```

Events: `request_context_initialized`, `log_level_invalid_fallback`.

### 3) Controller / Route

Source anchor: `laa-inquests-external-ui/src/infrastructure/express/routes/claim/confirmAndSubmitClaim.router.ts`

```typescript
confirmAndSubmitClaimRouter.post("/check-your-answers", async (req, res) => {
  logger.logInfo("confirm_submit_route", "Submit claim requested", req, {
    event: "claim_submit_requested",
    laa_reference: req.session.applicationSummary?.laaReference,
  });
  await confirmAndSubmitAdaptor.processForm(req, res);
});
```

Events: `claim_submit_requested`, `journey_step_completed`, `route_validation_failed`.

### 4) Use Cases

Source anchor: `laa-inquests-external-ui/src/use-cases/claim/SubmitClaim.useCase.ts`

```typescript
if (result.status === "UNPROCESSABLE") {
  logger.logInfo("submit_claim_use_case", "Validation failure", undefined, {
    event: "claim_submit_validation_failed",
    error_code: result.errorCode,
  });
  return {
    status: "VALIDATION_FAILED",
    errorSummaries: { submitError: { text } },
  };
}
```

Events: `claim_submit_validation_failed`, `claim_submit_succeeded`, `eligibility_decision_made`.

### 5) Domain

Source anchor: `laa-inquests-external-ui/src/domain/Client/CorrespondenceRecipient.ts`

```typescript
// Keep domain objects deterministic and log-free.
export class CorrespondenceRecipient {
  constructor(
    public recipientType: "PERSON" | "ORGANISATION",
    public recipientName: string,
  ) {}
}
// Use case / route layers log state transitions instead.
```

Event policy: no direct domain logs.

### 6) Outbound Adapters

Source anchor: `laa-inquests-external-ui/src/adaptors/source/inquests-api/claim/SubmitClaim/SubmitClaim.adaptor.ts`

```typescript
const startedAt = Date.now();
const response = await postToInquestsApi({...});
logger.logInfo("submit_claim_adapter", "API call complete", undefined, {
  event: "outbound_api_call",
  target_service: "laa-inquests-api",
  route: "/applications/:laaReference/claim",
  status_code: response.status,
  duration_ms: Date.now() - startedAt,
});
```

Events: `outbound_api_call`, `outbound_api_retry`, `outbound_api_failed`.

### 7) Error Middleware

Source anchor: `laa-inquests-external-ui/src/infrastructure/express/middleware/errors/errors.ts`

```typescript
logger.logError("server_error_middleware", "Internal Server Error", err, req, {
  event: "http_request_failed",
  route: req.route?.path ?? req.path,
  method: req.method,
  status_code: 500,
});
```

Events: `http_request_failed`, `unexpected_error_boundary`.

## Event list policy (not exhaustive)

- Event names in this plan are baseline requirements and examples, not a closed catalog.
- Keep stable baseline names for request lifecycle, boundary failures, and key business milestones.
- Add new `snake_case` events as features evolve; keep names outcome-based and dashboard-friendly.
- Treat renames/removals as breaking changes for observability consumers.

## Logger middleware standard (must match internal UI exactly)

Implement this exact contract in `logger.ts` (same behavior as internal UI):

1. Allowed levels and ordering:
   - `const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const`
   - `const LOG_LEVEL_PRIORITY = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 }`
2. Config parsing:
   - `getConfiguredLogLevel()` reads `process.env.LOG_LEVEL` once, lowercases it, validates against `LOG_LEVELS`.
   - invalid/missing value falls back to `info`.
   - emit one startup warning event (for example `log_level_invalid_fallback`) when fallback is used.
3. Gate rule:
   - `shouldLog(eventLevel, configuredLevel)` returns `true` only when `priority(eventLevel) >= priority(configuredLevel)`.
   - apply this gate before writing any log output.
4. Method behavior:
   - `logDebug`, `logInfo`, `logWarn`, `logError` all call a shared emission path.
   - `logError` includes safe error metadata (`exception_type`, sanitized message), not raw stack payloads from dependencies.
5. Context extraction:
   - `request_id` from `x-request-id` or generated UUID.
   - `correlation_id` from `x-correlation-id` or `request_id` fallback.
   - never derive correlation ids from token substrings.
6. Output shape:
   - non-local envs emit structured JSON with snake_case envelope keys.
   - dev/test can emit readable text, but must preserve the same semantic fields.

Reference implementation shape:

```typescript
const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function getConfiguredLogLevel(): LogLevel {
  const candidate = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return LOG_LEVELS.includes(candidate as LogLevel)
    ? (candidate as LogLevel)
    : "info";
}

function shouldLog(eventLevel: LogLevel, configuredLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[eventLevel] >= LOG_LEVEL_PRIORITY[configuredLevel];
}
```

Required usage pattern inside logger methods:

```typescript
const configuredLevel = getConfiguredLogLevel();

type LogContext = {
  request_id: string;
  correlation_id: string;
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "Missing Error Message";
}

function extractContext(request?: Request): LogContext {
  const request_id = request?.get("x-request-id") ?? randomUUID();
  const correlation_id = request?.get("x-correlation-id") ?? request_id;
  return { request_id, correlation_id };
}

function buildMessage(
  functionName: string,
  message: string,
  level: LogLevel,
  context: LogContext,
): string {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return `[${new Date().toISOString()}] ${level.toUpperCase()} ${functionName} ${context.correlation_id} ${message}`;
  }

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME ?? "laa-inquests-external-ui",
    environment: process.env.NODE_ENV ?? "development",
    message,
    request_id: context.request_id,
    correlation_id: context.correlation_id,
    function_name: functionName,
  });
}

public logDebug(functionName: string, message: string, request?: Request): void {
  if (!shouldLog("debug", configuredLevel)) return;
  console.debug(buildMessage(functionName, message, "debug", extractContext(request)));
}

public logInfo(functionName: string, message: string, request?: Request): void {
  if (!shouldLog("info", configuredLevel)) return;
  console.log(buildMessage(functionName, message, "info", extractContext(request)));
}

public logWarn(functionName: string, message: string, request?: Request): void {
  if (!shouldLog("warn", configuredLevel)) return;
  console.warn(buildMessage(functionName, message, "warn", extractContext(request)));
}

public logError(functionName: string, message: string, err?: unknown, request?: Request): void {
  if (!shouldLog("error", configuredLevel)) return;
  console.error(
    buildMessage(
      functionName,
      `${message} - Error: ${getErrorMessage(err)}`,
      "error",
      extractContext(request),
    ),
  );
}
```

Required middleware-level decisions to preserve:

- cache configured level once at startup/module-load, not per log call.
- on invalid `LOG_LEVEL`, fallback to `info` and emit one warning event (`log_level_invalid_fallback`).
- always prefer `x-request-id` and `x-correlation-id`; if absent, generate UUID and reuse as fallback.
- keep output keys snake_case in structured logs: `request_id`, `correlation_id`, `status_code`, `duration_ms`.
- keep the same gate semantics as internal UI; any change here requires matching update there.

Only route names and optional business context fields may vary between UI repos; level parsing, thresholding, and id policy must remain aligned.

## Implementation sequence

1. Add `LOG_LEVEL` handling helpers in logger middleware and use them in all log methods.
2. Replace token-derived correlation id logic with `x-correlation-id` / generated fallback.
3. Standardize structured keys to snake_case (`request_id`, `correlation_id`, etc.).
4. Refactor route/use case/adapter logs to stable event names.
5. Ensure one error event per failed request at error middleware boundary.
6. Add tests for level gating and context redaction.

## Acceptance checks

- External UI logger and internal UI logger have matching `LOG_LEVEL` gate behavior.
- Request-completion logs always include `request_id`, `correlation_id`, and `duration_ms`.
- No tokens/session payloads/PII appear in route or adapter logs.
- Key user journeys emit stable and searchable event names.

## Agent handoff notes

- Treat this document as implementation source of truth for this repo.
- Follow the examples first; only deviate when code structure requires a minimal adaptation.
- Preserve all existing behavior except logging format/content/placement and context propagation.

## Add a logging skill for future changes

Create a short repo-specific logging skill so future agents add logs consistently in `laa-inquests-external-ui`.

Front matter to include at the top of the skill file:

```yaml
---
name: external-ui-logging
description: Rules for adding and updating logs in laa-inquests-external-ui. Use this when changing logger middleware, request context propagation, route logging, use case logging, adapter logging, or error middleware logging.
---
```

Skill content should briefly cover:

1. Shared UI logger helpers that must be reused: `LOG_LEVELS`, `LOG_LEVEL_PRIORITY`, `getConfiguredLogLevel`, `shouldLog`.
2. Request context policy: use `x-request-id` and `x-correlation-id` (or generated fallback), never token-derived correlation ids.
3. Layer responsibilities: routes/use cases/adapters/error middleware and expected event types for each.
4. Log level policy and environment defaults.
5. Redaction rules and banned fields.
6. A copy/paste snippet for a compliant `logger.logInfo(...)` call with structured context.

Definition of done for the skill:

- It explicitly states that level-gating behavior must match `laa-inquests-internal-ui`.
- It includes one compliant and one non-compliant example.
- It links back to this plan as the external UI source of truth.
