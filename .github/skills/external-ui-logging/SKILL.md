---
name: external-ui-logging
description: Rules for adding and updating logs in laa-inquests-external-ui. Use this when changing logger middleware, request context propagation, route logging, use case logging, adapter logging, or error middleware logging.
---

# External UI Logging

## Required shared helpers

Reuse the logger helpers in `src/infrastructure/express/middleware/logger/logger.ts`:

- `LOG_LEVELS`
- `LOG_LEVEL_PRIORITY`
- `getConfiguredLogLevel`
- `shouldLog`

Level-gating behavior must stay aligned with `laa-inquests-internal-ui`.

## Request context policy

- Use `x-request-id` for `request_id` when available.
- Use `x-correlation-id` for `correlation_id` when available.
- If missing, generate a UUID for `request_id` and use it as `correlation_id` fallback.
- Never derive correlation IDs from token substrings.

## Layer responsibilities

- Routes: log journey entry/exit and validation outcomes.
- Use cases: log business milestones and validation failures.
- Outbound adapters: log outbound API call outcome, status code, and duration.
- Error middleware: emit one failed-request boundary event.

## Log levels and defaults

Allowed values: `debug`, `info`, `warn`, `error`, `fatal`.

Defaults:

- Local: `debug`
- Dev: `info`
- Staging: `info`
- Prod: `warn`

## Redaction and banned fields

Do not log:

- Session blobs
- Access tokens, ID tokens, raw auth artifacts
- Free-text payloads
- PII (names, emails, addresses, identifiers)

Prefer booleans/counts/known codes over raw values.

## Compliant example

```ts
logger.logInfo("confirm_submit_route", "Submit claim requested", req, {
  event: "claim_submit_requested",
  route: req.route?.path ?? req.path,
  method: req.method,
});
```

## Non-compliant example

```ts
logger.logInfo("submit_application", "payload debug", req, {
  event: "submit_application_payload",
  payload: req.session,
  accessToken: req.session.accessToken,
});
```
