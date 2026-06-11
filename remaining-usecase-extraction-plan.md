# Remaining Use Case Extraction Plan (Post-Confirmation)

## Goal

Extract business logic from the remaining presenter adaptors into application use cases while preserving current route/view behavior and keeping changes as small as possible.

This plan is based on:

1. Current presenter responsibilities in `ClientDetails`, `DeceasedDetails`, `Proceedings`, and `PublicAuthority`
2. The constraints used for `Confirmation`
3. Lessons learned during the completed `Confirmation` extraction

## Guardrails (Carry Forward from Confirmation)

- Move-only refactor where possible: preserve behavior, route paths, templates, copy, and redirects
- No new dependencies
- Keep hexagonal boundaries strict:
  - Use cases: business composition/decision logic only
  - Presenter adaptor: request/session mapping + render/redirect orchestration only
- No direct `express`, `Request`, `Response`, or session helper imports in use cases
- Use class-per-use-case style
- Keep `UseCaseResult` contract style already introduced in `src/use-cases/common/useCaseResult.types.ts`
- Keep wiring manual in `src/infrastructure/express/routes/index.ts`
- Keep validation error payload shape unchanged (`errorSummaries`)

## What Should Move vs Stay

### Stays in Presenter Adaptors

- Reading request body/query/session
- Writing session values (from use-case output)
- Rendering templates and redirecting
- Passing csrf token
- Calling existing validators (unless specific business validation is promoted into use case)

### Moves to Use Cases

- Branching and next-step decisions
- Mapping/parsing logic that converts raw state into domain/application DTOs
- Add/remove list item decisions
- Summary list and view model composition that is currently business-oriented
- Safety checks for invalid state used to decide technical failure result

## Feature-by-Feature Extraction Plan

## 1) Proceedings (Low complexity, best next candidate)

### Current presenter logic to extract

- Option filtering/selection flow decisions
- Confirmation flow branching (`add another?`, empty-list guard)
- Remove proceeding behavior and success message decision

### Proposed use cases

- `BuildProceedingsSelectionViewUseCase`
  - Input: selected proceedings
  - Output: `proceedingOptions`, `selectedProceedings` rows
- `AddProceedingUseCase`
  - Input: selected proceeding id + current selected proceedings
  - Output: updated selected proceedings or validation/technical failure
- `DecideProceedingsConfirmationNextStepUseCase`
  - Input: add-another value + selected proceedings
  - Output: next step (`/apply/proceedings` or `/apply/deceased-details/name`) or errors
- `RemoveProceedingUseCase`
  - Input: proceeding id + confirmation + selected proceedings
  - Output: updated list + optional success message

### New types

- `src/use-cases/apply/proceedings/models/proceedingsSessionState.types.ts`

## 2) Public Authority (Very similar to Proceedings)

### Current presenter logic to extract

- Option filtering/selection flow decisions
- Confirmation branching and empty-list guard
- Remove behavior and success message decision

### Proposed use cases

- `BuildPublicAuthoritySelectionViewUseCase`
- `AddPublicAuthorityUseCase`
- `DecidePublicAuthorityConfirmationNextStepUseCase`
- `RemovePublicAuthorityUseCase`

### New types

- `src/use-cases/apply/publicAuthority/models/publicAuthoritySessionState.types.ts`

## 3) Deceased Details (Linear form journey, medium complexity)

### Current presenter logic to extract

- Back button decision for name page
- Step-to-step progression decisions
- State composition for step payloads (deceased details slice)

### Proposed use cases

- `DetermineDeceasedNameBackLinkUseCase`
- `BuildDeceasedNameViewUseCase`
- `BuildDateOfDeathViewUseCase`
- `BuildDateOfBirthViewUseCase`
- `BuildClientRelationshipViewUseCase`
- `BuildCoronerReferenceViewUseCase`
- `BuildFurtherInformationViewUseCase`
- `DecideDeceasedDetailsNextStepUseCase` (or one small use case per step)

### New types

- `src/use-cases/apply/deceasedDetails/models/deceasedDetailsSessionState.types.ts`

## 4) Client Details (Highest complexity, do last)

### Current presenter logic to extract

- Correspondence source branching and route decisions
- Correspondence recipient selection parsing and recipient object construction
- Redirect decision depending on existing selected proceedings
- Home/correspondence address view model composition decisions
- Type-guarded state normalization

### Proposed use cases

- `BuildClientNameDobViewUseCase`
- `BuildClientHomeAddressViewUseCase`
- `DecideHomeAddressNextStepUseCase`
- `BuildCorrespondenceAddressSourceViewUseCase`
- `DecideCorrespondenceAddressSourceNextStepUseCase`
- `BuildCorrespondenceAddressViewUseCase`
- `BuildCorrespondenceRecipientViewUseCase`
- `UpdateCorrespondenceRecipientUseCase`
- `DecideCorrespondenceRecipientNextStepUseCase`
- `BuildPreviousApplicationViewUseCase`
- `DecidePreviousApplicationNextStepUseCase`

### New types

- `src/use-cases/apply/clientDetails/models/clientDetailsSessionState.types.ts`

## Delivery Sequence

1. Extract Proceedings use cases and wire in routes index
2. Extract Public Authority using mirrored pattern from Proceedings
3. Extract Deceased Details with small per-step use cases
4. Extract Client Details last in small slices, starting with correspondence flow
5. Optional hardening pass: consolidate shared list add/remove patterns into common use-case helpers (only if no behavior risk)

## Lessons Learned Applied to Next Phases

- Keep adaptor constructors below lint parameter limits by injecting a grouped dependency object
- Keep session-to-state mapping split into small private mapper helpers to avoid complexity violations
- Prefer `safeParse` in use cases and return `TECHNICAL_FAILURE` rather than throwing parse exceptions
- Keep use-case outputs semantic (section-shaped DTOs), so presenter only spreads into render models
- Migrate logic incrementally per route method to keep diff size controlled and test failures easy to isolate

## Testing and Verification Strategy

For each feature extraction phase:

1. Run baseline before edits
   - `yarn test`
2. Implement one small route slice at a time
3. Re-run targeted tests after each slice
4. Run full checks at end of phase:
   - `yarn lint`
   - `yarn tsc`
   - `yarn test`

## Risks and Mitigations

- **Risk:** hidden behavior coupling in session mutation order
  - **Mitigation:** keep session writes in presenter, keep existing order, and only move decision/composition logic
- **Risk:** branching regressions in multi-step flows
  - **Mitigation:** extract in route-step-sized increments and rely on existing unit + e2e coverage
- **Risk:** adaptor complexity temporarily increases during transition
  - **Mitigation:** introduce mapper helpers first, then swap route method logic to use cases

## Acceptance Criteria

- Remaining presenter adaptors contain orchestration only
- Use cases contain decision/composition logic with no web/session framework coupling
- Routes/templates/redirects unchanged
- No new dependencies
- `yarn lint`, `yarn tsc`, and `yarn test` pass after each feature phase
