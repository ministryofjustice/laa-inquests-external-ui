---
name: error-handling
description: Rules for designing, implementing, testing, logging, or reviewing errors, exceptions, failure results, Axios/MSAL failures, presenter error responses, and Express error middleware in laa-inquests-external-ui.
user-invocable: false
---

# Error Handling

Use this skill whenever changing or reviewing an error path. Existing hybrid
error handling is legacy code and is not precedent for new or migrated paths.

## Failure Model

Classify failures before choosing a representation:

| Failure                                                                                | Representation                                                                             | Owner                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------- |
| Form validation                                                                        | Validation result with error summaries                                                     | Inbound adapter/validator |
| Expected absence, such as no provider offices or no public authorities                 | Use-case-specific result or `undefined` at the port                                        | Use case/port             |
| Business outcome or invalid application state                                          | Use-case-specific result                                                                   | Use case                  |
| Any upload/delete failure (virus scan, rejection, transport)                           | Expected result value (e.g. `FILE_SCAN_FOUND_VIRUS`, `UPLOAD_REJECTED`, `DELETE_REJECTED`) | Outbound adapter/use case |
| External authentication, authorization, availability, or response failure (non-upload) | Sanitized `ApplicationError`                                                               | Outbound adapter          |
| Programmer or framework error                                                          | Original exception                                                                         | Generic error middleware  |

Do not represent the same failure as both a result and an exception within one
operation. The upload virus-scan rejection is an expected outcome rendered as a
user-facing message; it is never an `ApplicationError`.

**Upload/delete carve-out.** File upload and delete flows use a value-based
protocol only: the adapter returns a discriminated union (`SUCCESS`,
`FILE_SCAN_FOUND_VIRUS`, `UPLOAD_REJECTED`/`DELETE_REJECTED`) and never throws
an `ApplicationError`. This is deliberate: the upload widget's contract is to
render every failure inline (JSON for the JS uploader, an HTML re-render for the
no-JS path), so a technical failure must not propagate to the generic middleware
and become an XHR-breaking HTML 500 or a full error page. The adapter still logs
each outcome once at the boundary and Zod-validates the upstream payload
(malformed → `UPLOAD_REJECTED`).

## Application Errors

- Define the application error contract in the application layer under
  `src/use-cases/common/`, outside `src/ports/` because ports contain
  interfaces only.
- Use stable types such as `AUTHENTICATION_REQUIRED`, `FORBIDDEN`,
  `UPSTREAM_UNAVAILABLE`, `UPSTREAM_REJECTED`, and `INVALID_UPSTREAM_RESPONSE`.
- Include only stable, non-sensitive policy fields: `type`, `operation`, and
  `retryable`.
- Never attach Axios, MSAL, Express, ORM, SDK, response, request, token, or
  payload objects through `cause` or another property.
- Expected not-found outcomes are values, not technical exceptions.

## Outbound Adapters

- Catch infrastructure-client errors at the adapter boundary.
- Log the raw failure once with safe transport metadata.
- Translate it to `ApplicationError` before it crosses the boundary.
- Validate responses inside the adapter and translate schema failures to
  `INVALID_UPSTREAM_RESPONSE`.
- Missing credentials must prevent the external call and become a classified
  application error (`AUTHENTICATION_REQUIRED`, logged as
  `missing_credentials`).
- Never return `cause?: unknown` in a port-facing result.
- Keep the upload virus-scan rejection as an expected result value, not an
  exception.

## Use Cases

- Let translated technical exceptions propagate unchanged.
- Do not catch an exception merely to log, rename, wrap, or return
  `TECHNICAL_FAILURE`.
- Do not import the concrete logger or any infrastructure module.
- Keep expected validation, not-found, and business outcomes in
  use-case-specific result types.
- Do not emit logging events directly. HTTP-driven business success events are
  emitted by presenters after the use case succeeds.

## Inbound Adapters and Middleware

- Presenters map expected outcomes to HTTP responses.
- Presenters must not `throw new Error(result.reason)`, must not
  `res.redirect("/error")`, must not render a generic 500 response, and must
  not log a technical exception before propagating it.
- Presenters call use cases; use cases call ports. The only permitted
  pass-through exceptions are the evidence download stream and the auth
  ceremony, and each must be tested at its boundary.
- Presenters emit semantic success events only after the awaited use case
  succeeds and before redirecting or rendering.
- Routes pass rejected presenter promises to Express error middleware.
- Auth middleware maps `AUTHENTICATION_REQUIRED` and `FORBIDDEN` to the agreed
  redirect/403 behavior before the generic handler.
- Generic middleware sets the real HTTP 500 status before rendering.
- `/error` is retired once no presenter depends on it.

## Logging Ownership

A failed external request may produce two complementary records:

1. `outbound_api_request_failed` in the outbound adapter, with transport detail.
2. `http_request_failed`, `auth_session_expired`, or `api_forbidden` at the
   final HTTP boundary, with request outcome detail.

Do not add use-case or presenter copies of the same technical failure.

Outbound events use:

- `outbound_api_call` at `info` for success;
- `outbound_api_not_found` at `warn` for expected absence;
- `outbound_api_request_failed` at `error` for translated failures.

Include `operation`, route template, method, `duration_ms`, `failure_type`,
`retryable`, safe `upstream_status_code`, `request_id`, `correlation_id`, and
permitted identifiers where relevant. Keep `exception_type` and
`exception_message` on the outbound failure record. Never log tokens,
authorization headers, request or response bodies, query strings, session
dumps, free text, MSAL account objects, upstream payloads, or stack traces.

Allowed `operation` values:

- `submit_application`
- `get_provider_offices`
- `get_public_bodies`
- `upload_coroners_letter`
- `delete_coroners_letter`
- `search_cases`
- `submit_claim`
- `upload_evidence`
- `delete_evidence`
- `download_evidence`

Allowed `failure_type` values: `missing_credentials`, `unauthenticated`,
`forbidden`, `timeout`, `network`, `upstream_4xx`, `upstream_5xx`,
`invalid_response`. Expected not-found uses `outbound_api_not_found`, not a
failure event.

Event-name reconciliations: `inquests_api_request_failed` becomes
`outbound_api_request_failed`; `auth_token_exchange_failed` becomes
`auth_token_acquisition_failed`. Keep `auth_session_expired` (upstream 401)
distinguishable from the existing local session-timeout event in
`src/infrastructure/express/session/`.

Retain these presenter-owned business success events at `info`, each emitted
exactly once after confirmed success and never on validation or persistence
failure:

- `application_submitted` (LAA reference only, no applicant/deceased PII)
- `claim_submitted` (permitted claim reference only, no free-text amounts)
- `coroners_letter_uploaded` (file id only, never contents)
- `evidence_uploaded` (evidence id only, never contents)
- `evidence_deleted` (evidence id only)

Emit these expected-warning events once at `warn` in the presenter when the
expected result is mapped to an HTTP response: `provider_offices_not_found`,
`public_authorities_not_found`, `coroners_letter_scan_rejected`,
`evidence_scan_rejected`, `submit_application_invalid_input`,
`submit_claim_invalid_input`. Normal form-validation failures stay validation
results, not warnings.

## Required Tests

For each migrated vertical slice:

1. Start with the Playwright behavior and obtain approval before implementation.
2. Test adapter success, expected 404, 401, 403, timeout/network failure, 5xx,
   malformed response, missing credentials, upload virus-scan rejection,
   logging cardinality, and redaction.
3. Test that the use case returns expected outcomes and propagates the exact
   `ApplicationError` instance unchanged.
4. Test that the presenter maps expected outcomes, emits success events once,
   emits none on failure, and propagates technical errors unchanged.
5. Test route forwarding once per distinct wrapper shape.
6. Test middleware status, redirect-loop prevention, rendering, event level,
   context, and redaction.
7. Test Playwright success, 401, 403, 404, generic 500, malformed response, and
   accessibility where relevant.

Axios and MSAL error objects may appear only in outbound adapter tests. Tests
above that boundary construct `ApplicationError` directly.

## Review Checklist

- No external client type or error escapes an outbound adapter.
- No SDK error is stored as an application-error cause.
- No use case imports infrastructure or logs directly.
- No presenter renders a generic 500, redirects to `/error`, throws
  `new Error(result.reason)`, or duplicates a technical error log.
- Expected outcomes are not generic exceptions.
- HTTP status is set, not only passed to a template.
- Semantic success events occur only after confirmed success.
- Logs contain required safe context and exclude sensitive data.
- Negative and accessibility tests cover the changed path.
- Migrated code does not copy inline `{ status; reason }` `TECHNICAL_FAILURE`
  unions, `throw new Error(result.reason)`, `res.redirect("/error")`, or
  per-layer technical catch-and-wrap patterns from legacy code.
