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

- Routes/presenters: log journey entry/exit, validation outcomes, and business success events after the use case succeeds.
- Use cases: do not import the concrete logger or emit logging events. Expected outcomes are returned as results; technical exceptions propagate unchanged.
- Outbound adapters: log the outbound API call outcome (status code, duration) and, on failure, one translated failure event before throwing a sanitized `ApplicationError`.
- Error middleware: emit one failed-request boundary event and set the real HTTP status.

When changing any error path, also load the `error-handling` skill.

## Error-path events

A failed external request produces at most two complementary records: one
`outbound_api_request_failed` at the outbound boundary, and one
`http_request_failed`, `auth_session_expired`, or `api_forbidden` at the final
HTTP boundary. Do not duplicate the same technical failure in use cases or
presenters.

Outbound events: `outbound_api_call` (info, success), `outbound_api_not_found`
(warn, expected absence), `outbound_api_request_failed` (error, translated
failure). Failure records include `operation`, route template,
`upstream_method`, `duration_ms`, `failure_type`, `retryable`, safe
`upstream_status_code`, plus `exception_type` and `exception_message`.

Allowed `failure_type` values: `missing_credentials`, `unauthenticated`,
`forbidden`, `timeout`, `network`, `upstream_4xx`, `upstream_5xx`,
`invalid_response`.

Presenter-owned business success events (info, once, after confirmed success):
`application_submitted`, `claim_submitted`, `coroners_letter_uploaded`,
`evidence_uploaded`, `evidence_deleted`.

Event-name reconciliations: `inquests_api_request_failed` becomes
`outbound_api_request_failed`; `auth_token_exchange_failed` becomes
`auth_token_acquisition_failed`. Keep `auth_session_expired` (upstream 401)
distinguishable from the local session-timeout event in
`src/infrastructure/express/session/`.

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
