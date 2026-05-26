# GitHub Copilot Instructions — laa-inquests-external-ui

This document is the authoritative guide for AI-assisted development on this project. All Copilot suggestions and generated code must conform to the standards defined here. It is designed to support multiple teams working collaboratively with the highest technical standards.


## 1. Project Overview

**Service:** LAA Inquests External UI — a GOV.UK-styled provider-facing web application for submitting Legal Aid Agency Inquests applications.
**Users:** Legal aid providers (solicitors, law firms) submitting Inquests applications on behalf of clients.
**Backend:** The UI communicates with the `inquests-api` backend. It does not own any data persistence; it is a thin form-driven UI layer.
**Phase:** Alpha — the service is under active development. Assumptions are subject to change.

## 2. Architecture

This project follows a **Ports and Adaptors (Hexagonal Architecture)** pattern. The goal is to keep business logic free of framework concerns and testable in isolation.

### Layer Responsibilities

| Layer                  | Location                                             | Responsibility                                                                                                                           |
|------------------------|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **Ports**              | `src/ports/`                                         | TypeScript interfaces defining contracts with external systems (e.g. APIs). Never contain implementation.                                |
| **Source Adaptors**    | `src/adaptors/source/`                               | Implementations of port interfaces. Contain HTTP client logic (Axios). One adaptor per external service operation.                       |
| **Presenter Adaptors** | `src/adaptors/presenters/`                           | Handle HTTP request/response logic. Render views or redirect. Delegate to validators and source adaptors. Think of these as controllers. |
| **Validators**         | `src/adaptors/presenters/.../[Feature].validator.ts` | Extend `FormValidator`. Contain form validation logic only. Return typed error summary objects.                                          |
| **Routes**             | `src/infrastructure/express/routes/`                 | Define Express route bindings. Use factory functions (`createXRouter`). Contain **no** business logic.                                   |
| **Infrastructure**     | `src/infrastructure/`                                | Framework wiring: middleware, config, session type extensions, i18n setup, build config.                                                 |
| **Views**              | `src/views/`                                         | Nunjucks templates. Logic-free. Receive data from presenter adaptors.                                                                    |
| **Utils**              | `src/utils/`                                         | Shared utility classes (e.g. `FormValidator`, `Formatter`, `dateFormatter`).                                                             |
| **Models / Schemas**   | `src/adaptors/presenters/<journey>/models/`          | Zod schemas and derived TypeScript types for API contracts.                                                                              |

### Dependency Injection

Dependencies are wired manually in `src/infrastructure/express/routes/index.ts`. Do not use a DI framework. Factories and constructors provide dependencies explicitly so that tests can inject stubs.

### Node version

Always use the version in `.nvmrc`. Run `nvm use` before starting work. The version is enforced in `package.json#engines`.

### Yarn

Use `yarn` exclusively. Do not use `npm` or `npx`. Enable Corepack: `corepack enable`.

---

## 4. Directory Structure

```
src/
  app.ts                          # Express app entry point
  adaptors/
    models/                       # Zod schemas + TypeScript types
    presenters/
      apply/
        [Feature]/
          [Feature].adaptor.ts    # Presenter adaptor (controller)
          [Feature].validator.ts  # Form validator (extends FormValidator)
    source/
      inquests-api/
        apply/
          [Operation]/
            [Operation].adaptor.ts  # Source adaptor (implements port)
            models/                 # Request/response types
  infrastructure/
    build/                        # esbuild configuration
    config/
      config.ts                   # Typed config object from env vars
      config.types.ts             # Config interface
      helmet.ts                   # Helmet/CSP configuration
    express/
      index.types.ts              # Shared Express type utilities
      middleware/                 # Express middleware setup
      routes/
        index.ts                  # Composition root: wires all routers
        apply/
          [feature].router.ts     # Route definitions (factory pattern)
      session/
        index.types.ts            # express-session type augmentation
        sessionHelpers.ts         # Session utility functions
    locales/
      en.json                     # All user-facing strings (English)
      constants.ts                # Error messages + app constants
  ports/
    source/
      inquests-api/
        [Operation].port.ts       # Port interface definition
  utils/
    FormValidator.ts              # Base validator class
    Formatter.ts                  # Data formatting helpers
    dateFormatter.ts              # Date formatting helpers
  views/
    base.njk                      # Base layout template
    apply/
      [feature]/                  # Nunjucks templates per feature
    main/                         # Non-journey pages (index, etc.)
tests/
  unit/
    src/                          # Mirrors src/ structure
  playwright/
    e2e/                          # End-to-end test specs
    factories/                    # Mock API handlers (MSW)
    fixtures/                     # Playwright fixtures
    pages/                        # Page Object Models
    utils/                        # E2E test utilities
```

## 5. Coding Conventions

### General

- All source files are TypeScript. JavaScript files are only permitted for build tooling output or legacy compatibility.
- Use ES modules (`import`/`export`). Never use `require()`.
- Keep files small and single-purpose. If a file exceeds ~200 lines, consider splitting.
- Named exports are preferred. Default exports are acceptable only for Express apps, routers, and Nunjucks templates.
- Avoid magic numbers and strings. Extract constants to `src/infrastructure/locales/constants.ts`.
- All user-facing strings belong in `src/infrastructure/locales/en.json`. Never hardcode UI copy in TypeScript.
- No `console.log` in production code paths. Use the logger from `src/infrastructure/express/middleware/logger.ts`.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Files/folders | `camelCase` for most files | `clientDetails.router.ts` |
| Classes | `PascalCase` | `ClientDetailsAdaptor` |
| Interfaces | `PascalCase`, no `I` prefix | `ClientDetailsFormData` |
| Constants | `UPPER_SNAKE_CASE` | `EMPTY_ARR_LENGTH` |
| Variables / params | `camelCase` | `clientFirstName` |
| Private class methods | `#camelCase` (native private) | `#formatProceedingOptions` |
| Nunjucks templates | `kebab-case.njk` | `name-and-dob.njk` |
| URL paths | `kebab-case` | `/client-details/name-and-dob` |
| HTML form field names | `kebab-case` | `first-name`, `dob-day` |
| Test files | `[Name].spec.ts` | `ClientDetails.adaptor.spec.ts` |

### Imports

Always use the `#src/` path alias for imports within `src/`. Do not use relative paths that traverse upwards (e.g. `../../`).

Always include the `.js` extension in import paths (required for NodeNext module resolution even in TypeScript source).

Type-only imports must use `import type`:

### Error handling

- Always handle rejected promises explicitly. Do not swallow errors silently.
- Validation errors must return a rendered form with `errorSummaries` — never throw.

## 7. Testing Standards

### Unit Tests (Mocha + Chai + Sinon)

- Every behaviour should be covered by tests.
- Every adaptor method must have at least one passing happy path test and one test for the error/validation path.
- Test files live in `tests/unit/` and **mirror the `src/` directory structure exactly**.
- Tests files should be named `[ClassName].spec.ts`.
- Use `import { strict as assert } from "assert"` for assertions.
- Use `stubInterface<T>()` from `ts-sinon` to stub Express `Request` and `Response` objects.
- Each `describe` block represents a class or module. Each `it` block represents a single behaviour.
- Test names should read as sentences: `it("redirects to nino form when name is valid")`.
- Do not test implementation details. Test observable behaviour (redirects, renders, session writes).
- Do not test private methods directly. Test them through the public interface.
- Validators should have their own spec files separate from adaptor specs.


### E2E Tests (Playwright)

- E2E tests for each journey step must cover 
  - the happy path 
  - each validation error
  - the back and continue/submit buttons
  - CSFR (if it's a form page)
- Develop utility functions for each step in the test (e.g. the functions in `form-validation-utils.js`)



## 9. Accessibility Standards

- Use GOV.UK Frontend components from `govuk-frontend` and MoJ Frontend from `@ministryofjustice/frontend`. Do not build custom equivalents of existing design system components.
- Colour must not be the sole means of conveying information.

---

## 10. Internationalisation (i18n)

- All user-facing strings must be stored in `src/infrastructure/locales/en.json`.

## 13. API Integration

### Port → Adaptor Pattern

For every new API operation:

1. Define a port interface in `src/ports/source/inquests-api/[Operation].port.ts`.
2. Implement the port in `src/adaptors/source/inquests-api/apply/[Operation]/[Operation].adaptor.ts`.
3. Define request/response types in `.../[Operation]/models/[Operation].types.ts`.
4. Define a Zod schema for the response in `src/adaptors/models/`.
5. Wire the adaptor in `src/infrastructure/express/routes/index.ts`.

### HTTP Client

Use Axios injected via the constructor. Never instantiate Axios inside an adaptor method. The Axios instance is created in `index.ts` and injected at composition root.

## 14. Views & Templating

- Templates must contain **no** business logic. All data transformation happens in adaptors before rendering.
- Use GOV.UK Frontend macros for all standard components (buttons, inputs, radios, checkboxes, error summaries, etc.).

## 15. Environment & Configuration

All configuration is read from environment variables and exposed via the typed `config` object in `src/infrastructure/config/config.ts`. Do not access `process.env` directly outside of `config.ts`.

Copy `.env.example` to `.env` for local development. Never commit `.env`.

## 18. Copilot Workflow Rules

These rules govern how GitHub Copilot should behave when assisting with development on this project.

### Before starting any feature

1. **Prompt for ticket.** Ask for the Jira ticket ID (`IDDS-XXX`) if it has not been provided.
2. **Clarify any details about the feature.**
3. **Run the tests.** Ensure all tests are passing before starting development of a new feature
4. **Check for existing patterns.** Before writing new code, locate the nearest analogous existing feature (e.g. `ClientDetailsAdaptor`) and follow the same pattern exactly.

### Code generation rules

* **Start by writing end-to-end tests.** These tests should cover the feature and demonstrate what you are trying to do. Wait for my approval before continuing development.
* **Develop the feature one test at a time.** Write a unit test and make it pass with minimum code changes. Wait for approval before continuing development.
* **Repeatedly run the tests.** Verify that new tests fail as expected. When you make them pass, run them to check they pass successfully.
* **Run tests after refactoring.** Verify that refactoring hasn't broken the tests. Fix the code and not the tests if they do break.
* **Update the documentation when you have finished a feature.**
* **All code MUST match our architecture.**
* **NEVER install a new dependency.** Stop and recommend a dependency for me to install.

### When editing existing files

- Make surgical changes only. Do not refactor unrelated code in the same PR.
- Do not change test assertions without understanding why the test was written that way.
- If linting fails after a change, fix it — do not suppress rules unless unavoidable and justified.

### Running checks locally

Before considering a task complete, always verify:

```bash
yarn lint          # ESLint + Prettier check
yarn tsc           # TypeScript type check
yarn test          # Run ALL tests
```

### When the instructions are ambiguous

If these instructions do not cover a specific case, stop and ask me how you should proceed.

## Exploration

Always output exploration and plans as a markdown file in the repo.
