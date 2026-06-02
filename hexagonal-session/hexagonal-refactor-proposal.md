# Hexagonal Refactor Proposal (No Code Changes)

## Objective
Extract business concepts and rules out of presenter adaptors into:
- **Domain layer**: business entities/value objects and their invariants/decisions.
- **Application layer**: use-case orchestration + validation policies.
- Keep presenters as **inbound adapters** and source adapters as **outbound adapters**.

---

## Current Hotspots (Where logic is concentrated now)

Primary files:
- `src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts`
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts`
- `src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts`
- `src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts`
- `src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts`
- `src/adaptors/presenters/apply/*/*.validator.ts`
- `src/utils/FormValidator.ts`
- `src/utils/Formatter.ts`
- `src/infrastructure/express/session/index.types.ts`

---

## Classification: What should move to Domain

## 1) Core business concepts (entities/value objects)
1. **Client aggregate**
   - currently spread across session primitives (`clientFirstName`, `clientDob*`, `clientHomeAddress`, `clientCorrespondenceAddressSource`, `clientCorrespondenceRecipient`, etc.)
   - refs: `src/infrastructure/express/session/index.types.ts`, `src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts`, `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts`
2. **Deceased aggregate**
   - refs: `src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts`, `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts`
3. **Address value object** (`HomeAddress`, `CorrespondenceAddress`)
   - normalization rules currently in `ClientDetailsFormatter.buildClientHomeAddress` / `buildClientCorrespondenceAddress`
   - ref: `src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.ts`
4. **CorrespondencePolicy value object / domain service**
   - decisions around source and recipient:
     - can home address be selected?
     - who is correspondence recipient?
     - is recipient client or care-of?
   - refs: private methods in `ClientDetails.adaptor.ts` (`#isClientNoFixedAbode`, `#isCorrespondenceAddressSource`, `#buildClientCorrespondenceRecipient`), and `Confirmation.adaptor.ts` (`#getClientCorrespondenceAddressSource`, `#applyClientCorrespondenceRecipientForSubmit`)
5. **ProceedingsSelection** and **PublicAuthoritiesSelection** domain collections
   - add/remove/contains/at-least-one invariants
   - refs: `Proceedings.adaptor.ts`, `PublicAuthority.adaptor.ts`, validators checking non-empty list

## 2) Domain rules/invariants (not HTTP/form concerns)
1. If client has no fixed abode, source cannot be `USE_CLIENT_HOME_ADDRESS`
   - currently in `ClientDetails.validator.ts`
2. If correspondence recipient is "none", recipient object is null/absent
   - currently split between `ClientDetails.adaptor.ts` and `Confirmation.adaptor.ts`
3. "At least one proceeding" and "at least one public authority" as domain constraints
   - currently in validators but conceptually domain-level collection invariant
4. Eligibility-style business rule:
   - deceased relationship "no" => ineligible path semantics
   - currently in `DeceasedDetails.validator.ts`

## 3) Domain typing cleanup
Move business-oriented types out of presenter/infrastructure-centric locations:
- from `src/adaptors/presenters/apply/models/form.types.ts` (business-like enums/types mixed with form DTOs)
- from `src/infrastructure/express/session/index.types.ts` (domain types coupled to session transport)
to domain-centered modules (while keeping separate mapping DTOs for forms/session).

---

## Classification: What should move to Application

## 1) Use-case orchestration services (per step / per command)
This is a good extraction because the current `process*` methods are making
business-flow decisions, not just deciding how to draw HTML.

Why this is **application logic**:
- It coordinates a user intent across boundaries: input validation, session
  state transitions, business decisions, and the next action.
- It is transport-agnostic in principle: the same orchestration should work for
  web, API, CLI, or job-based entry points.
- It encodes workflow policy (what happens next when valid/invalid), which is a
  use-case concern rather than a template/render concern.
- It is the right place to call outbound ports (for example submission) after
  domain/application rules pass.

Why this is **not presentation logic**:
- Presentation should only translate HTTP details (`req`, `res`, csrf, render,
  redirect) to/from use-case inputs and outputs.
- Presentation should not own business branching like "if source is X and no
  fixed abode then reject" or "if list empty then block progression".
- Keeping these rules in presenters duplicates policy across pages and makes
  reuse/testing harder.

Resulting boundary:
- Presenter = parse request + call use case + map result to `render`/`redirect`.
- Application use case = orchestrate validation, domain decisions, state
  changes, and next-step outcomes.

Each `process*` method in presenters should delegate to an application service:
1. `ProcessClientNameAndDob`
2. `ProcessClientNino`
3. `ProcessClientHomeAddress`
4. `ProcessCorrespondenceAddressSource`
5. `ProcessCorrespondenceAddress`
6. `ProcessCorrespondenceRecipient`
7. `ProcessHasPreviousApplication`
8. `ProcessProceedingSelection` / `ConfirmProceedings` / `RemoveProceeding`
9. `ProcessPublicAuthoritySelection` / `ConfirmPublicAuthorities` / `RemovePublicAuthority`
10. `ProcessDeceased*` step services
11. `SubmitApplication` orchestration (currently in `ConfirmationAdaptor.processClientDeclarationForm` and `#generateSubmitBody`)

Refs:
- `src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts`
- `src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts`
- `src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts`
- `src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts`
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts`

## 2) Validation as application policy
Current validators should become application validators (input policy for use-cases), not presenter-owned:
- `ClientDetails.validator.ts`
- `DeceasedDetails.validator.ts`
- `Proceedings.validator.ts`
- `PublicAuthority.validator.ts`
- shared primitives in `src/utils/FormValidator.ts` should move to application validation utilities

## 3) Mapping/orchestration now in adaptors should be app services
1. Session -> domain state reconstruction
2. Domain -> session updates (patches)
3. Domain/application result -> presenter response model (redirect target + errors + data)
4. Submission payload assembly currently in `ConfirmationAdaptor.#generateSubmitBody` and helper methods:
   - `#buildClientForSubmit`
   - `#applyOptionalClientFields`
   - `#applyClientAddressesForSubmit`
   - `#applyClientCorrespondenceRecipientForSubmit`
   - `#buildDeceasedForSubmit`
   - `#buildProceedingsForSubmit`
   - `#buildPublicBodiesForSubmit`

---

## Keep in Presenters (Do NOT extract)
1. `req` / `res` interaction and route-level rendering
2. CSRF token passing (`res.locals.csrfToken`)
3. `res.render(...)`, `res.redirect(...)`
4. HTTP query/body extraction (basic parsing only)
5. Purely view-oriented formatting (if presentation-only)

---

## Keep in Infrastructure (Do NOT extract)
1. Express route wiring in `src/infrastructure/express/routes/*.ts`
2. Session store mechanics in `src/infrastructure/express/session/sessionHelpers.ts`
3. Axios transport in source adapters (e.g. `SubmitApplication.adaptor.ts`)
4. Config access in `src/infrastructure/config/config.ts`

---

## Secondary: Proposed target layout (lightweight)

```text
src/
  domain/
    client/
      Client.ts
      CorrespondencePolicy.ts
      Address.ts
      CorrespondenceRecipient.ts
      CorrespondenceAddressSource.ts
    deceased/
      Deceased.ts
      Relationship.ts
    proceedings/
      ProceedingsSelection.ts
      Proceeding.ts
    publicAuthority/
      PublicAuthoritySelection.ts
      PublicAuthority.ts

  application/
    common/
      validation/
        ValidationResult.ts
        rules/
    apply/
      clientDetails/
        useCases/
          ProcessNameAndDob.ts
          ProcessNino.ts
          ProcessHomeAddress.ts
          ProcessCorrespondenceSource.ts
          ProcessCorrespondenceAddress.ts
          ProcessCorrespondenceRecipient.ts
          ProcessHasPrevApplication.ts
        validators/
      deceasedDetails/
        useCases/
        validators/
      proceedings/
        useCases/
        validators/
      publicAuthority/
        useCases/
        validators/
      confirmation/
        useCases/
          SubmitApplication.ts
        mappers/
          SessionToDomainMapper.ts
          DomainToSubmitApplicationMapper.ts
```

---

## Suggested migration order (low-risk)
1. Extract pure domain value objects first (`Address`, `CorrespondenceRecipient`, enums/rules).
2. Introduce one application use-case for one presenter action (start with a simple one like proceedings add/remove).
3. Move one validator set to application layer and keep presenter contract unchanged.
4. Extract submit-body creation from `ConfirmationAdaptor` into `SubmitApplication` application service.
5. Repeat step-by-step, keeping routes/presenters stable.

---

## Notes / Known overlap decisions
- Some rules exist in both validation and assembly paths (especially correspondence behavior). Consolidate rule ownership in domain + application service APIs.
- `Formatter` currently mixes presentation formatting and option filtering; split into:
  - domain/application selection policies
  - presenter-only view model formatting

