# Client Object Migration Map

This file lists all places where the `Client` domain object should be used or kept aligned.

## Primary adoption points (use `Client`)

- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:316-332`  
  `#buildClientForSubmit` currently returns a raw object literal and should instantiate `new Client(...)`.
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:150-155`  
  `#generateSubmitBody` builds and mutates `client`; this should flow through the `Client` object (or `ClientFields` before construction).
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:169-183`  
  `#applyOptionalClientFields` mutates `client` fields that belong to `Client`.
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:185-222`  
  `#applyClientAddressesForSubmit` sets `hasNoFixedAbode`, `correspondenceAddressSource`, `correspondenceAddress`, and `homeAddress`.
- `src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:224-242`  
  `#applyClientCorrespondenceRecipientForSubmit` sets `isClientCorrespondenceRecipient` and `correspondenceRecipient`.

## Schema/type contract points (keep aligned with `Client`)

- `src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.ts:9-51`  
  Canonical Zod `client` contract must mirror `Client` fields and nullability.
- `src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.schema.ts:52-73`  
  Cross-field rules for `isClientCorrespondenceRecipient` and `correspondenceRecipient` must remain consistent with `Client` invariants.

## Test migration points (use `Client`-based fixtures)

- `tests/unit/src/adaptors/presenters/apply/confirmation/Confirmation.adaptor.spec.ts:259-354`  
  Main success-path assertions for `submitBody.client`.
- `tests/unit/src/adaptors/presenters/apply/confirmation/Confirmation.adaptor.spec.ts:356-423`  
  Optional-field omission behavior (`clientLastNameAtBirth`, `nationalInsuranceNumber`).
- `tests/unit/src/adaptors/presenters/apply/confirmation/Confirmation.adaptor.spec.ts:425-493`  
  `correspondenceAddressSource` and `correspondenceAddress` assertions.
- `tests/unit/src/adaptors/presenters/apply/confirmation/Confirmation.adaptor.spec.ts:495-611`  
  `correspondenceRecipient` behavior assertions.
- `tests/unit/src/adaptors/presenters/apply/confirmation/Confirmation.adaptor.spec.ts:613-677`  
  Optional nullable fields when session data is null.
- `tests/unit/src/adaptors/source/inquests-api/apply/SubmitApplication.adaptor.spec.ts:38-48`  
  Raw `client` fixture used by source adaptor test.
