---
name: outbound-adapters
description: Rules for writing outbound adapters (also called secondary adapters or infrastructure adapters) in hexagonal architecture. Use this when creating or modifying or reviewing any code that talks to the outside world on behalf of the application (databases, external APIs, file systems, message brokers, etc.).
---

# Outbound Adapters

An outbound adapter implements an outbound port so that the application can interact with external systems.

## Responsibilities

- Implement exactly one outbound port interface.
- Translate between the domain/use-case model and the external system's model (SQL rows, API payloads, file formats, etc.).
- Handle infrastructure-level errors and translate them into domain-meaningful exceptions or result types.

## Rules

- Implement port interfaces — do not call directly by use cases without a port. They may implement more than one port.
- Contain no business logic.
- Contain no domain logic.
- Own the mapping between domain types and external representations. External types MUST NOT escape this layer (e.g. database models)
- Keep all infrastructure-specific concerns (ORMs, HTTP clients, SDK calls) inside this layer.

## Failure translation

Load the `error-handling` skill before changing any failure path. In short:

- Expected absence (e.g. no results) is a value or `undefined`; an upload virus-scan rejection is an expected result value. These are not exceptions.
- Every unexpected technical failure (missing credentials, 401, 403, timeout, network, upstream 4xx/5xx, invalid response) is translated to a sanitized `ApplicationError` before it crosses the boundary.
- Log the raw Axios/MSAL error exactly once at the boundary with safe transport metadata, then translate. Never retain the SDK error as `cause` and never return `cause?: unknown` in a port-facing result.

## Anti-patterns to avoid

- Leaking ORM entities, HTTP response models, or SDK types into use cases or the domain.
- A single adapter implementing concerns from multiple external systems.
- Performing business decisions inside an adapter. In particular validation of business concerns.

## Testing

Should be tested with:

- Unit tests that either
  - mock out the external system
  - use a live external system
  - use some sort of replacement stand in for the external system
