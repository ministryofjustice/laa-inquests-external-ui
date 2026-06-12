# Use Case Extraction Review Guide (Confirmation + Phases 1-4)

## Scope and commits

This review guide covers the three refactor commits:

- `c571bcf` - confirmation extraction (`Confirmation`)
- `a60257c` - Phase 1-3 extraction (`Proceedings`, `PublicAuthority`, `DeceasedDetails`)
- `796dffb` - Phase 4 extraction (`ClientDetails`)

Design intent applied throughout:

- Keep route/view behaviour unchanged
- Keep redirects and step movement in presenter adaptors
- Move only decision/composition/state-update logic to use cases
- Keep wiring manual in `src/infrastructure/express/routes/index.ts`
- No test file changes

## Thematic changes

### 1) Presenter adaptors now orchestrate, use cases compute

Presenter adaptors still:

- Read request/session/form body
- Call validators
- Render templates and redirect
- Write session values

Use cases now handle:

- View-model composition
- Option filtering and selected-row formatting orchestration
- Add/remove collection updates
- Recipient selection parsing and domain recipient construction

### 2) Routing/step movement remains in presenters

There is no `NextStep` routing logic in new use cases.

- `Proceedings` and `PublicAuthority` confirmation redirects are still in adaptor methods
- `DeceasedDetails` per-step redirects remain in adaptor methods
- `ClientDetails` redirect branching (including proceedings vs confirmation redirect) remains in adaptor methods

### 3) Manual dependency wiring in routes index

`src/infrastructure/express/routes/index.ts` now instantiates and injects all use cases into adaptors for Phases 1-4.

### 4) Confirmation extraction established the pattern baseline

The earlier confirmation refactor (`c571bcf`) introduced the same structural approach used in later phases:

- Dedicated use-case classes for composition/validation/submission steps
- Shared use-case result contract in `src/use-cases/common/useCaseResult.types.ts`
- Presenter adaptor retained orchestration and web/session boundary responsibilities

## Complete file list

### Modified files

- `src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts`
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts`
- `src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts`
- `src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts`
- `src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts`
- `src/infrastructure/express/routes/index.ts`

### New files - Confirmation (baseline extraction)

- `src/use-cases/apply/confirmation/BuildCheckYourAnswers.useCase.ts`
- `src/use-cases/apply/confirmation/SubmitApplication.useCase.ts`
- `src/use-cases/apply/confirmation/ValidateClientDeclaration.useCase.ts`
- `src/use-cases/apply/confirmation/models/confirmationSessionState.types.ts`
- `src/use-cases/common/useCaseResult.types.ts`

### New files - Proceedings (Phase 1)

- `src/use-cases/apply/proceedings/AddProceeding.useCase.ts`
- `src/use-cases/apply/proceedings/BuildProceedingsSelectionView.useCase.ts`
- `src/use-cases/apply/proceedings/RemoveProceeding.useCase.ts`
- `src/use-cases/apply/proceedings/models/proceedingsSessionState.types.ts`

### New files - Public Authority (Phase 2)

- `src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.ts`
- `src/use-cases/apply/publicAuthority/BuildPublicAuthoritySelectionView.useCase.ts`
- `src/use-cases/apply/publicAuthority/RemovePublicAuthority.useCase.ts`
- `src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.ts`

### New files - Deceased Details (Phase 3)

- `src/use-cases/apply/deceasedDetails/BuildDeceasedDetailsView.useCase.ts`
- `src/use-cases/apply/deceasedDetails/models/deceasedDetailsSessionState.types.ts`

### New files - Client Details (Phase 4)

- `src/use-cases/apply/clientDetails/BuildClientHomeAddressView.useCase.ts`
- `src/use-cases/apply/clientDetails/BuildClientNameDobView.useCase.ts`
- `src/use-cases/apply/clientDetails/BuildCorrespondenceAddressSourceView.useCase.ts`
- `src/use-cases/apply/clientDetails/BuildCorrespondenceAddressView.useCase.ts`
- `src/use-cases/apply/clientDetails/BuildCorrespondenceRecipientView.useCase.ts`
- `src/use-cases/apply/clientDetails/BuildPreviousApplicationView.useCase.ts`
- `src/use-cases/apply/clientDetails/UpdateCorrespondenceRecipient.useCase.ts`
- `src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.ts`

## Reviewer guide (recommended order)

Use this sequence to validate architecture first, then behaviour parity.

1. Done Review the shared use-case contract in `src/use-cases/common/useCaseResult.types.ts`
   - Check: status semantics are clear and consistently usable (`SUCCESS`, `VALIDATION_FAILED`, `TECHNICAL_FAILURE`).
   - Outcome: you have a baseline for reading all extracted use-case returns.

2. Done Review confirmation as the reference implementation
   - Files: `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts`, `src/use-cases/apply/confirmation/BuildCheckYourAnswers.useCase.ts`, `src/use-cases/apply/confirmation/SubmitApplication.useCase.ts`, `src/use-cases/apply/confirmation/ValidateClientDeclaration.useCase.ts`, `src/use-cases/apply/confirmation/models/confirmationSessionState.types.ts`.
   - Check: presenter handles web/session orchestration; use cases handle composition/validation/submit decisions.
   - Outcome: confirm the extraction pattern used by later phases.

3. Done Review dependency wiring centrally in `src/infrastructure/express/routes/index.ts`
   - Check: all use cases are manually instantiated and injected; no hidden DI or route behaviour changes.
   - Outcome: confidence that runtime wiring matches intended architecture.

4. Done Review proceedings flow extraction
   - Files: `src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts`, `src/use-cases/apply/proceedings/AddProceeding.useCase.ts`, `src/use-cases/apply/proceedings/BuildProceedingsSelectionView.useCase.ts`, `src/use-cases/apply/proceedings/RemoveProceeding.useCase.ts`, `src/use-cases/apply/proceedings/models/proceedingsSessionState.types.ts`.
   - Check: add/remove/selection logic moved to use cases, while redirects remain in presenter.
   - Outcome: parity with previous behaviour for proceedings journey.

5. Done Review public authority flow extraction
   - Files: `src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts`, `src/use-cases/apply/publicAuthority/AddPublicAuthority.useCase.ts`, `src/use-cases/apply/publicAuthority/BuildPublicAuthoritySelectionView.useCase.ts`, `src/use-cases/apply/publicAuthority/RemovePublicAuthority.useCase.ts`, `src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.ts`.
   - Check: mirrors proceedings pattern and preserves confirmation-step behaviour.
   - Outcome: confirm consistency between structurally similar journeys.

6. Review deceased details flow extraction
   - Files: `src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts`, `src/use-cases/apply/deceasedDetails/BuildDeceasedDetailsView.useCase.ts`, `src/use-cases/apply/deceasedDetails/models/deceasedDetailsSessionState.types.ts`.
   - Check: view-state composition moved; step-to-step redirects still in presenter.
   - Outcome: ensure linear journey behaviour is unchanged.

7. Review client details flow extraction (largest surface area)
   - Files: `src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts`, `src/use-cases/apply/clientDetails/BuildClientHomeAddressView.useCase.ts`, `src/use-cases/apply/clientDetails/BuildClientNameDobView.useCase.ts`, `src/use-cases/apply/clientDetails/BuildCorrespondenceAddressSourceView.useCase.ts`, `src/use-cases/apply/clientDetails/BuildCorrespondenceAddressView.useCase.ts`, `src/use-cases/apply/clientDetails/BuildCorrespondenceRecipientView.useCase.ts`, `src/use-cases/apply/clientDetails/BuildPreviousApplicationView.useCase.ts`, `src/use-cases/apply/clientDetails/UpdateCorrespondenceRecipient.useCase.ts`, `src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.ts`.
   - Check: session normalization + recipient update logic moved cleanly; presenter still owns route movement.
   - Outcome: verify highest-risk journey still renders/redirects exactly as before.

8. Finish with a cross-cutting architecture pass across all new use-case files
   - Check: no `express`/`Request`/`Response` coupling; no route-path coupling in use cases.
   - Outcome: validate hexagonal boundary integrity across confirmation + phases 1-4.

## High-risk areas to scrutinize

- `ClientDetails` correspondence-recipient flow:
  - default/no-selection rendering state
  - validation error re-render state
  - `NONE` selection mapping to `null`
- `Proceedings` and `PublicAuthority` add/remove mutation ordering
- Session type-normalization helpers used before passing state into use cases
- Any accidental route coupling in use-case classes (should be none)

## Behavioural assertions for reviewer checklist

- No route paths changed
- No template names changed
- No redirect destination changed
- `errorSummaries` shape remains unchanged
- Session writes still happen in presenters
- No test assertions were altered

## Validation run summary

During implementation, the following checks were executed and passed:

- `yarn lint`
- `yarn tsc`
- `yarn test`
