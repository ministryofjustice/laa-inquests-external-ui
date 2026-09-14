---
name: ports
description: Rules for defining ports in hexagonal architecture. Use this when creating or modifying or reviewing an interface or abstract type that acts as a boundary between the application and its adapters.
---

# Ports

A port is an interface (or abstract type) that defines how the application communicates with the outside world.

## Two kinds of port

- **Inbound port** — defines what the application _offers_ (use case interfaces that inbound adapters call). You do not have to use these often.
- **Outbound port** — defines what the application _needs_ from the outside world (implemented by outbound adapters). Particularly in a typed language, these should be used EVERY TIME a use case needs to access an adapter.

## Responsibilities

- Express intent in domain language — method names and parameter types should not reveal the underlying technology.
- Act as the contract between layers.

## Rules

- Defined inside the application layer (use cases or domain), never in an adapter.
- Contain no implementation logic.
- Use domain types or simple value objects in signatures — no framework or infrastructure types.
- Each port should represent a single, cohesive capability (e.g. `UserRepository`, `EmailSender`). Ports SHOULD refer to the needs of a single usecase.

## Error handling

Load the `error-handling` skill before changing any failure path. Port methods return domain/simple values and expected outcomes (including `undefined` for expected absence). Unexpected technical failures surface as a thrown sanitized `ApplicationError`, defined in the application layer — not in a port. Never add framework/SDK error types or a `cause?: unknown` field to a port-facing result.

## Anti-patterns to avoid

- Adding infrastructure-specific types (SQL result sets, HTTP responses) to port signatures.
- Creating a single mega-port that covers many unrelated capabilities.
- Implementing logic inside a port definition.
