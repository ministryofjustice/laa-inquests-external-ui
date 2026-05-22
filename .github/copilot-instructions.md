# GitHub Copilot Instructions — laa-inquests-external-ui

This document is the authoritative guide for AI-assisted development on this project. All Copilot suggestions and generated code must conform to the standards defined here. It is designed to support multiple teams working collaboratively with the highest technical standards.


## 1. Project Overview

**Service:** LAA Inquests External UI — a GOV.UK-styled provider-facing web application for submitting Legal Aid Agency Inquests applications.

**Users:** Legal aid providers (solicitors, law firms) submitting Inquests applications on behalf of clients.

**Backend:** The UI communicates with the `inquests-api` backend. It does not own any data persistence; it is a thin form-driven UI layer.

**Phase:** Alpha — the service is under active development. Assumptions are subject to change.

> **TODO: Complete this section 1st** — Add a more detailed description of the business domain, the full application journey, and links to service design documentation (e.g. Confluence space, Miro boards, prototype).

---

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

```ts
// Pattern: router factory function receives its adaptor as a parameter
export function createClientDetailsRouter(
  router: Router,
  adaptor: ClientDetailsAdaptor,
): Router { ... }

// Wired at composition root (index.ts):
const adaptor = new ClientDetailsAdaptor(new ClientDetailsValidator());
indexRouter.use("/apply", createClientDetailsRouter(express.Router(), adaptor));
```

### Key Design Rules

- Ports are interfaces, never classes.
- Source adaptors implement exactly one port interface.
- Presenter adaptors do **not** call each other.
- Route files contain **no** validation, business logic, or session writes.
- Private class methods use the `#` prefix (native JS private, not `private` keyword).

---

## 3. Tech Stack & Tooling

| Concern              | Tool / Version                                                   |
|----------------------|------------------------------------------------------------------|
| Runtime              | Node.js `25.8.2`                                                 |
| Language             | TypeScript `~6.x` (strict mode, ES2024 target, NodeNext modules) |
| Package manager      | Yarn `4.10.3` via Corepack                                       |
| Web framework        | Express `^5.x`                                                   |
| Templating           | Nunjucks `^3.x`                                                  |
| GOV.UK Design System | `govuk-frontend ^6.x`, `@ministryofjustice/frontend ^9.x`        |
| HTTP client          | Axios `^1.x`                                                     |
| Schema validation    | Zod `^4.x`                                                       |
| Form validation      | `express-validator ^7.x` + custom `FormValidator` base class     |
| Session              | `express-session`                                                |
| CSRF                 | `csrf-sync ^4.x`                                                 |
| Security headers     | `helmet ^8.x`                                                    |
| Rate limiting        | `express-rate-limit ^8.x`                                        |
| i18n                 | `i18next ^26.x`                                                  |
| Unit testing         | Mocha `^11.x` + Chai `^6.x` (strict assert) + Sinon / `ts-sinon` |
| E2E testing          | Playwright `^1.x` + `@axe-core/playwright`                       |
| Coverage             | `c8 ^10.x`                                                       |
| Linting              | ESLint `^10.x` (`eslint-config-love`)                            |
| Formatting           | Prettier `^3.x`                                                  |
| Pre-commit hooks     | Husky `^9.x` + `lint-staged`                                     |
| Frontend build       | esbuild + SASS                                                   |
| Containerisation     | Docker                                                           |
| Deployment           | Kubernetes (MoJ Cloud Platform) via Helm                         |
| CI/CD                | GitHub Actions                                                   |

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
- Do not leave TODO comments in committed code — raise a Jira ticket instead.
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

```ts
// ✅ Correct
import { FormValidator } from "#src/utils/FormValidator.js";

// ❌ Wrong
import { FormValidator } from "../../utils/FormValidator.js";
```

Always include the `.js` extension in import paths (required for NodeNext module resolution even in TypeScript source).

Type-only imports must use `import type`:

```ts
import type { Request, Response } from "express";
```

### Error handling

- Always handle rejected promises explicitly. Do not swallow errors silently.
- Propagate HTTP errors to Express error middleware using `next(error)`.
- Validation errors must return a rendered form with `errorSummaries` — never throw.

> **TODO: Complete this section 3rd** — Define the full error handling strategy including error page templates, logging levels, and how API errors surface to users (e.g. friendly error pages vs. retry prompts).

---

## 6. TypeScript Standards

- `strict: true` is enforced in `tsconfig.json`. All strict checks must pass.
- `noImplicitAny: true`. Every variable must have an explicit or inferable type.
- Use `interface` for object shape definitions (enforced by ESLint `@typescript-eslint/consistent-type-definitions`).
- Use `type` only for unions, intersections, and utility type aliases.
- Avoid `any`. If unavoidable, add an ESLint disable comment with a justification.
- Avoid non-null assertions (`!`). Use optional chaining (`?.`) and nullish coalescing (`??`).
- Prefer `unknown` over `any` for genuinely unknown data (e.g. parsed JSON from an untrusted source).
- Use Zod schemas to parse and validate all data arriving from external APIs. Derive TypeScript types from Zod schemas using `z.infer<>`.
- Use `TypedRequestBody<T>` from `#src/infrastructure/express/index.types.js` for typed request bodies in adaptor methods.

```ts
// ✅ Use Zod for external data
const result = ApplicationSchema.parse(response.data);

// ✅ Use TypedRequestBody for form submissions
processNameForm(req: TypedRequestBody<Partial<ClientDetailsFormData>>, res: Response): void
```

---

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


```ts
// ✅ Canonical unit test pattern
describe("ClientDetailsAdaptor", () => {
  it("redirects to /nino when name form is valid", () => {
    const adaptor = new ClientDetailsAdaptor(new ClientDetailsValidator());
    const req = stubInterface<Request>();
    const res = stubInterface<Response>();
    req.body = { "first-name": "Jane", "last-name": "Doe", "name-change": "false", "dob-day": "1", "dob-month": "6", "dob-year": "1990" };

    adaptor.processNameForm(req, res);

    assert.equal(res.redirect.callCount, 1);
    assert.equal(res.redirect.getCall(0).args[0], "/apply/client-details/nino");
  });
});
```

### E2E Tests (Playwright)

- E2E tests live in `tests/playwright/e2e/`.
- E2E tests for each journey step must cover 
  - the happy path 
  - each validation error
  - the back and continue/submit buttons
  - CSFR (if it's a form page)
- Develop utility functions for each step (e.g. the functions in `form-validation-utils.js`)
---

## 8. Security Standards

The following security measures are already configured. Every new feature must respect and not bypass them.

### CSRF Protection

All forms that mutate state must include the CSRF token. The token is available as `res.locals.csrfToken` and must be rendered as a hidden field:

```njk
<input type="hidden" name="_csrf" value="{{ csrfToken }}">
```

Never disable CSRF middleware for a route.

### Content Security Policy

CSP is configured via Helmet in `src/infrastructure/config/helmet.ts`. A cryptographic nonce is generated per-request in `nonceMiddleware` and is available as `res.locals.cspNonce`. Inline scripts must use this nonce — do not use `'unsafe-inline'`.

### Helmet

Do not weaken Helmet configuration without a security review. In particular, do not disable `x-frame-options`, `hsts`, or `noSniff`.

### Session

- Sessions use `express-session` with `resave: false` and `saveUninitialized: false`.
- Never store sensitive data in the session beyond what is required to complete the current journey.
- `SESSION_SECRET` must be a strong random value in all non-development environments. Never commit a real secret.
- Session data should be cleared on journey completion or abandonment.

### Rate Limiting

Rate limiting is applied globally. Do not bypass or disable it for specific routes without approval.

### Secrets

- Never commit secrets, tokens, or credentials to source control.
- All secrets are injected at runtime via environment variables or Kubernetes secrets.
- The `.env` file is for local development only and is `.gitignore`d.

### Dependencies

- Dependabot is configured to raise PRs for dependency updates.
- Security advisories from Snyk (`.snyk`) must be reviewed and resolved promptly.
- Pin GitHub Actions to full commit SHAs (already enforced in existing workflows).

> **TODO: Complete this section 5th** — Document the penetration testing schedule, security review process for new features, and the Snyk integration/policy.

---

## 9. Accessibility Standards

- This service must meet **WCAG 2.2 AA** as required by the GOV.UK Service Standard.
- Use GOV.UK Frontend components from `govuk-frontend` and MoJ Frontend from `@ministryofjustice/frontend`. Do not build custom equivalents of existing design system components.
- All Playwright E2E tests must include an axe-core accessibility scan. A scan failure is a test failure.
- All form pages must include a visible `<h1>`, correctly associated labels for all inputs, and a GOV.UK-styled error summary rendered above the form on validation failure.
- Do not use `tabindex` values other than `0` or `-1`.
- All images must have meaningful `alt` text. Decorative images must have `alt=""` and `role="presentation"`.
- Interactive elements must have accessible names. Icon-only buttons must include a visually hidden label.
- Colour must not be the sole means of conveying information.

> **TODO: Complete this section 6th** — Define the manual accessibility testing process (e.g. screen reader testing with NVDA/VoiceOver/JAWS), the accessibility audit schedule, and how to handle known accessibility issues.

---

## 10. Internationalisation (i18n)

- All user-facing strings must be stored in `src/infrastructure/locales/en.json`.
- Error message constants (used in TypeScript) live in `src/infrastructure/locales/constants.ts`.
- i18next is initialised synchronously in middleware. Access translations via Nunjucks template helpers.
- Do not duplicate strings — reuse existing keys from the `common` namespace where applicable.
- Keys must be descriptive and namespaced by feature (e.g. `clientDetails.nameForm.firstNameLabel`).

> **TODO: Complete this section 7th** — Define the full i18n key naming convention, the Welsh (Cymraeg) translation strategy, and the process for requesting translations.

---

## 11. Forms & Validation

### Pattern

Every form step follows this pattern:

1. **GET** handler — renders the form, pre-populating from session.
2. **POST** handler — saves raw input to session, runs validation, re-renders with errors or redirects.
3. Validation logic lives in a dedicated `[Feature].validator.ts` class that extends `FormValidator`.
4. Error objects are typed (e.g. `Partial<ClientNameDobError>`) and passed to the view as `errorSummaries`.

### Validators

- Extend `FormValidator` from `#src/utils/FormValidator.js`.
- Each public method validates one logical group of fields and returns a typed partial error object.
- Validation methods must be pure — no session access, no side effects.
- Error messages must come from `constants.ts`, not be hardcoded inline.

### Error Display

- Error summaries are rendered using the GOV.UK Error Summary component.
- Individual field errors are passed alongside the summary.
- The page `<title>` must be prefixed with "Error:" when the form has validation errors.

### Form Field Names

HTML form field names use `kebab-case` (e.g. `first-name`, `dob-day`). These are mapped to camelCase session properties in the adaptor (e.g. `clientFirstName`).

---

## 12. Session Management

- Session type augmentation is in `src/infrastructure/express/session/index.types.ts`.
- All new session properties must be added to the `SessionData` interface extension with correct TypeScript types.
- Session helpers belong in `src/infrastructure/express/session/sessionHelpers.ts`.
- Do not access session properties directly from route files — use the adaptor layer.
- Session data must be treated as untrusted user input. Always validate before use.

---

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

### Error Handling

API errors must be caught, logged, and converted into user-friendly error states. Do not let raw Axios errors reach the view layer.

> **TODO: Complete this section 8th** — Document the full list of inquests-api endpoints, their request/response contracts, authentication mechanism (if any), and the API versioning strategy.

---

## 14. Views & Templating

- Templates use Nunjucks (`.njk` extension).
- All templates extend `base.njk`.
- Templates must contain **no** business logic. All data transformation happens in adaptors before rendering.
- Use GOV.UK Frontend macros for all standard components (buttons, inputs, radios, checkboxes, error summaries, etc.).
- Every page must include a phase banner, a back link, and a correctly structured `<main>` landmark.
- Page titles follow the format: `[Page name] — [Service name] — GOV.UK` (or `Error: [Page name] — ...` when validation errors are present).

> **TODO: Complete this section 9th** — Document the Nunjucks macro conventions, any custom MoJ Frontend macros in use, and the full base template structure including header/footer/phase banner.

---

## 15. Environment & Configuration

All configuration is read from environment variables and exposed via the typed `config` object in `src/infrastructure/config/config.ts`. Do not access `process.env` directly outside of `config.ts`.

### Required environment variables

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Strong random session signing secret |
| `SESSION_NAME` | Cookie name for the session |
| `INQUESTS_API_URL` | Base URL of the inquests-api backend |
| `NODE_ENV` | `development` \| `production` |

### Optional environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `SERVICE_NAME` | Display name of the service | `Inquests` |
| `SERVICE_PHASE` | Phase banner label | — |
| `RATE_LIMIT_MAX` | Max requests per window | `10000` |
| `RATE_WINDOW_MS` | Rate limit window in ms | `900000` |
| `CONTACT_EMAIL` | Support email shown in UI | — |
| `CONTACT_PHONE` | Support phone shown in UI | — |

Copy `.env.example` to `.env` for local development. Never commit `.env`.

> **TODO: Complete this section 10th** — Document the full set of environment variables for staging and production, the Kubernetes secret names, and the process for rotating secrets.

---

## 16. CI/CD & Deployment

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `unit-tests.yaml` | `workflow_call`, `workflow_dispatch` | Run Mocha unit tests + c8 coverage |
| `e2e-tests.yaml` | `workflow_call`, `workflow_dispatch` | Run Playwright E2E tests |
| `deploy-uat.yaml` | Push to branch | Deploy to UAT environment |
| `delete-uat-release.yaml` | PR close | Tear down UAT environment |
| `dependency-review.yaml` | PR to `main` | Check for vulnerable dependencies |
| `deploy-staging-and-prod.yaml` | Push of semver tag (`*.*.*`) | Deploy to staging then production |

### Deployment Process

1. All feature branches deploy to a **UAT** environment automatically on push.
2. Merging to `main` does **not** automatically deploy to staging or production.
3. A production deployment is triggered by pushing a **semver tag** (e.g. `1.2.3`).
4. Staging is always deployed before production (gating relationship in the workflow).
5. Slack notifications are sent to the team channel on staging and production deploys.

### Infrastructure

- Container images are pushed to AWS ECR.
- Deployed to Kubernetes via Helm on MoJ Cloud Platform.
- Liveness probe: `GET /status` → `200 OK`
- Readiness probe: `GET /health` → `200 Healthy`

> **TODO: Complete this section 11th** — Document the UAT URL, staging URL, production URL, the ECR repository name, Kubernetes namespace, Helm chart location, and the process for rolling back a bad deployment.

---

## 17. Git & Pull Request Workflow

### Branch naming

```
feature/IDDS-123-short-description
fix/IDDS-456-short-description
chore/IDDS-789-short-description
```

### Commit messages

Use conventional commit style with the Jira ticket prefix:

```
feat(IDDS-123): add client name form
fix(IDDS-456): correct NINO validation regex
chore(IDDS-789): update govuk-frontend to 6.1.0
```

### Pull Request title

Must match: `[IDDS-XXX] Ticket description`

### PR checklist (from `.github/pull_request_template.md`)

- [ ] Code has been personally tested in Docker
- [ ] PR title matches `[IDDS-XXX] Ticket description`
- [ ] No merge conflicts with `main`
- [ ] New tests written for new behaviour
- [ ] Lint and tests pass locally (`yarn lint && yarn test:unit`)
- [ ] Accessibility checked (axe-core E2E test passing)
- [ ] Any new env vars documented in `.env.example` and this file

### Code review

- At least one approval from `@ministryofjustice/check-client-qualifies-reviewers` is required.
- Reviewers should check for: security, accessibility, test coverage, architectural conformance, and user-facing string quality.
- Do not merge your own PR.

> **TODO: Complete this section 12th** — Define the expected review turnaround time, the escalation path for stale PRs, and the cross-team review protocol.

---

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

---

## 19. Cross-Team Collaboration

This service may be developed by multiple teams simultaneously. The following rules prevent conflicts and maintain consistency.

### Feature boundaries

> **TODO: Complete this section 13th** — Define the ownership boundaries between teams (e.g. which team owns which journey sections, which team owns infrastructure/middleware, which team owns the design system integration). This is critical for multi-team working.

### Shared code changes

Changes to the following files affect all teams and require explicit review from all team leads before merging:

- `src/infrastructure/express/middleware/index.ts`
- `src/infrastructure/config/config.ts`
- `src/infrastructure/express/routes/index.ts`
- `src/infrastructure/express/session/index.types.ts`
- `src/views/base.njk`
- `src/utils/FormValidator.ts`
- `src/infrastructure/locales/en.json`

### Avoiding merge conflicts on `en.json`

Each team should work in a distinct section of `en.json` namespaced to their feature (e.g. `"clientDetails": {}`, `"proceedings": {}`). Additions to the `"common"` section must be agreed between teams first.

### ADR (Architecture Decision Records)

Significant architectural changes must be documented as an ADR before implementation begins. Raise a Jira ticket and link it to the PR.

> **TODO: Complete this section 14th** — Define the ADR format and storage location (e.g. `docs/adr/`), the decision-making process, and how teams signal intent to change shared infrastructure.

### Communication channels

> **TODO: Complete this section 15th** — List the Slack channels for this project (e.g. `#laa-inquests-dev`, `#laa-inquests-deployments`), the escalation path for blocking issues, and the schedule for cross-team syncs.

---

## 20. Glossary

| Term | Definition |
|---|---|
| **LAA** | Legal Aid Agency |
| **Inquests** | Legal proceedings to investigate a death. This service supports providers applying for legal aid to represent clients at inquests. |
| **Provider** | A solicitor or law firm applying for legal aid on behalf of a client. |
| **IDDS** | The Jira project key for this service. |
| **Port** | A TypeScript interface defining a contract with an external system. |
| **Source Adaptor** | An Axios-based implementation of a port that communicates with the inquests-api. |
| **Presenter Adaptor** | An Express controller-equivalent that handles HTTP request/response and delegates to validators. |
| **GOV.UK Frontend** | The MoJ/CDDO design system component library. |
| **Cloud Platform** | MoJ's Kubernetes hosting platform (AWS EKS). |
| **UAT** | User Acceptance Testing environment — deployed per branch. |
| **NINO** | National Insurance Number. |
| **CSRF** | Cross-Site Request Forgery — token-based protection against forged form submissions. |
| **CSP** | Content Security Policy — HTTP header restricting resource loading. |
| **ADR** | Architecture Decision Record — a document capturing significant technical decisions. |
| **WCAG** | Web Content Accessibility Guidelines. This service targets 2.2 AA. |
