# TODO Migration Index

This file indexes all granular migration TODO comments added across `src/`.

## Summary

- Total TODOs: **108**
- Step 1 TODOs: **38**
- Step 2 TODOs: **25**
- Step 3 TODOs: **24**
- Step 4 TODOs: **10**
- Step 5 TODOs: **11**

## By Step (high-level)

### Step 1 (Domain extraction first)
Main targets:
- `domain/client/Address.ts`
- `domain/client/CorrespondencePolicy.ts`
- `domain/client/CorrespondenceRecipient.ts`
- `domain/client/CorrespondenceAddressSource.ts`
- `domain/client/Client.ts`
- `domain/deceased/Relationship.ts`
- `domain/proceedings/ProceedingsSelection.ts`
- `domain/publicAuthority/PublicAuthoritySelection.ts`
- Domain-type extraction from `src/infrastructure/express/session/index.types.ts`

### Step 2 (Introduce use cases)
Main targets:
- `application/apply/clientDetails/useCases/*`
- `application/apply/deceasedDetails/useCases/*`
- `application/apply/proceedings/useCases/*`
- `application/apply/publicAuthority/useCases/*`

### Step 3 (Validation extraction)
Main targets:
- `application/apply/clientDetails/validators/*`
- `application/apply/deceasedDetails/validators/*`
- `application/apply/proceedings/validators/*`
- `application/apply/publicAuthority/validators/*`
- `application/common/validation/*`

### Step 4 (Submission mapping/orchestration)
Main targets:
- `application/apply/confirmation/useCases/SubmitApplication`
- `application/apply/confirmation/mappers/DomainToSubmitApplicationMapper`

### Step 5 (Presentation/query model cleanup)
Main targets:
- presenter view-model mappers
- `application/apply/confirmation/viewModels/CheckYourAnswersQuery`
- split presenter formatters from domain/application selection helpers

## Full TODO Inventory (path:line)

```text
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:115:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessClientNino.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:161:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessClientHomeAddress.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:227:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessCorrespondenceAddressSource.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:22:  // # TODO Step 2: Move this to application/apply/clientDetails/useCases and keep this adaptor focused on HTTP mapping.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:288:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessCorrespondenceAddress.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:343:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessCorrespondenceRecipient.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:403:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessHasPreviousApplication.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:436:    // # TODO Step 1: Move this to domain/client/Address.ts via an Address mapper/value-object factory.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:445:    // # TODO Step 1: Move this to domain/client/Address.ts correspondence reconstruction.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:454:    // # TODO Step 1: Move this to domain/client/Address.ts as an Address invariant.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:469:    // # TODO Step 1: Move this to domain/client/CorrespondenceAddressSource.ts.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:480:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts state reconstruction.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:492:    // # TODO Step 1: Move this to domain/client/CorrespondenceRecipient.ts reconstruction.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:504:    // # TODO Step 1: Move this to domain/client/CorrespondenceRecipient.ts as recipient invariants.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:521:    // # TODO Step 1: Move this to domain/client/CorrespondenceAddressSource.ts enum/value parsing.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:532:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts selection parsing.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:541:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts recipient construction rule.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:558:    // # TODO Step 1: Move this to domain/client/Client.ts as a client behavior query.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.ts:56:    // # TODO Step 2: Move this to application/apply/clientDetails/useCases/ProcessClientNameAndDob.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.ts:107:    // # TODO Step 1: Move this to domain/client/Address.ts (correspondence normalization).
src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.ts:10:  // # TODO Step 5: Move this to presenter view-model mappers only; move business normalization to domain/application services.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.ts:147:    // # TODO Step 5: Move this to a dedicated presenter view-model mapper if it remains presentation-only.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.ts:170:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts (default recipient decision).
src/adaptors/presenters/apply/ClientDetails/ClientDetails.formatter.ts:77:    // # TODO Step 1: Move this to domain/client/Address.ts (construction and normalization).
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:126:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/ninoPolicy.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:162:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/previousApplicationPolicy.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:201:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/homeAddressPolicy.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:20:  // # TODO Step 3: Move this to application/apply/clientDetails/validators/ClientDetailsValidator.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:241:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts (no-fixed-abode source compatibility).
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:242:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/correspondenceSourcePolicy.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:24:    // # TODO Step 3: Move this to application/apply/clientDetails/validators with a ValidationResult contract.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:271:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/correspondenceAddressPolicy.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:310:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/correspondenceRecipientPolicy.
src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.ts:71:    // # TODO Step 3: Move this to application/apply/clientDetails/validators/namePolicy.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:111:    // # TODO Step 4: Move this to application/apply/confirmation/useCases/SubmitApplication.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:156:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:179:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:196:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts (correspondence/home address decisions).
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:197:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:237:    // # TODO Step 1: Move this to domain/client/CorrespondencePolicy.ts (recipient decision rules).
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:238:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:273:    // # TODO Step 5: Move this to a presenter view-formatting mapper if still needed.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:287:    // # TODO Step 5: Move this to a presenter view-formatting mapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:28:  // # TODO Step 4: Move this to application/apply/confirmation/useCases/SubmitApplication.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:292:    // # TODO Step 5: Move this to application/apply/confirmation/viewModels/CheckYourAnswersQuery.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:316:    // # TODO Step 5: Move this to application/apply/confirmation/viewModels/CheckYourAnswersQuery.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:332:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:351:    // # TODO Step 5: Move this to presenter view-model mappers/checkYourAnswersMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:378:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:403:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:413:    // # TODO Step 4: Move this to application/apply/confirmation/mappers/DomainToSubmitApplicationMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:422:    // # TODO Step 5: Move this to presenter view-model mappers/checkYourAnswersMapper.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:431:    // # TODO Step 1: Move this to domain/client/Address.ts reconstruction from persisted state.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:440:    // # TODO Step 1: Move this to domain/client/Address.ts correspondence reconstruction.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:44:    // # TODO Step 5: Move this to an application query/view-model mapper and keep this method render-only.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:451:    // # TODO Step 1: Move this to domain/client/CorrespondenceRecipient.ts reconstruction.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:460:    // # TODO Step 1: Move this to domain/client/Address.ts address invariants.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:476:    // # TODO Step 1: Move this to domain/client/CorrespondenceRecipient.ts recipient invariants.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:491:    // # TODO Step 1: Move this to domain/client/Client.ts behavior query.
src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.ts:498:    // # TODO Step 1: Move this to domain/client/CorrespondenceAddressSource.ts source selection rules.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:153:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedDateOfBirth.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:16:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases output policy.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:207:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedRelationship.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:257:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedCoronerReference.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:303:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedFurtherInformation.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:45:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedName.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:99:    // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases/ProcessDeceasedDateOfDeath.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.ts:9:  // # TODO Step 2: Move this to application/apply/deceasedDetails/useCases.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:124:    // # TODO Step 1: Move this to domain/deceased/Relationship.ts (eligibility rule for "false" branch).
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:125:    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/relationshipInputPolicy.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:167:    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/coronerReferencePolicy.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:188:    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/furtherInformationPolicy.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:20:  // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/DeceasedDetailsValidator.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:22:    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators with shared error contract.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:58:    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/dateOfDeathPolicy.
src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.ts:91:    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/dateOfBirthPolicy.
src/adaptors/presenters/apply/Proceedings.adaptor.ts:13:  // # TODO Step 2: Move this to application/apply/proceedings/useCases if this legacy adaptor is still in use.
src/adaptors/presenters/apply/Proceedings.adaptor.ts:153:    // # TODO Step 1: Move this to domain/proceedings/ProceedingsSelection.ts filtering behavior.
src/adaptors/presenters/apply/Proceedings.adaptor.ts:166:    // # TODO Step 5: Move this to a presenter view-model mapper if this legacy file is retained.
src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts:130:    // # TODO Step 2: Move this to application/apply/proceedings/useCases/ConfirmProceedings.
src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts:15:  // # TODO Step 2: Move this to application/apply/proceedings/useCases.
src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts:212:    // # TODO Step 2: Move this to application/apply/proceedings/useCases/RemoveProceeding.
src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts:219:      // # TODO Step 1: Move this to domain/proceedings/ProceedingsSelection.ts invariants.
src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.ts:49:    // # TODO Step 2: Move this to application/apply/proceedings/useCases/ProcessProceedingSelection.
src/adaptors/presenters/apply/Proceedings/Proceedings.validator.ts:12:  // # TODO Step 3: Move this to application/apply/proceedings/validators/ProceedingsValidator.
src/adaptors/presenters/apply/Proceedings/Proceedings.validator.ts:16:    // # TODO Step 3: Move this to application/apply/proceedings/validators/proceedingInputPolicy.
src/adaptors/presenters/apply/Proceedings/Proceedings.validator.ts:33:    // # TODO Step 3: Move this to application/apply/proceedings/validators/addAnotherPolicy.
src/adaptors/presenters/apply/Proceedings/Proceedings.validator.ts:49:    // # TODO Step 1: Move this to domain/proceedings/ProceedingsSelection.ts minimum-size invariant.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts:141:    // # TODO Step 2: Move this to application/apply/publicAuthority/useCases/ConfirmPublicAuthorities.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts:15:  // # TODO Step 2: Move this to application/apply/publicAuthority/useCases.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts:219:    // # TODO Step 2: Move this to application/apply/publicAuthority/useCases/RemovePublicAuthority.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts:229:      // # TODO Step 1: Move this to domain/publicAuthority/PublicAuthoritySelection.ts invariants.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.ts:57:    // # TODO Step 2: Move this to application/apply/publicAuthority/useCases/ProcessPublicAuthoritySelection.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.ts:28:  // # TODO Step 3: Move this to application/apply/publicAuthority/validators/PublicAuthorityValidator.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.ts:32:    // # TODO Step 3: Move this to application/apply/publicAuthority/validators/selectionPolicy.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.ts:49:    // # TODO Step 3: Move this to application/apply/publicAuthority/validators/addAnotherPolicy.
src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.ts:67:    // # TODO Step 1: Move this to domain/publicAuthority/PublicAuthoritySelection.ts minimum-size invariant.
src/infrastructure/express/session/index.types.ts:24:  // # TODO Step 1: Move this to domain/proceedings/Proceeding.ts and keep this file transport/session-only.
src/infrastructure/express/session/index.types.ts:31:  // # TODO Step 1: Move this to domain/publicAuthority/PublicAuthority.ts.
src/infrastructure/express/session/index.types.ts:37:  // # TODO Step 1: Move this to domain/client/Address.ts.
src/infrastructure/express/session/index.types.ts:46:  // # TODO Step 1: Move this to domain/client/CorrespondenceAddressSource.ts.
src/infrastructure/express/session/index.types.ts:52:  // # TODO Step 1: Move this to domain/client/CorrespondenceRecipient.ts.
src/infrastructure/express/session/index.types.ts:6:    // # TODO Step 1: Move this to application session DTO mapping that reconstructs domain aggregates.
src/utils/FormValidator.ts:65:    // # TODO Step 3: Move this to application/common/validation/dateValidationService with reusable error contracts.
src/utils/FormValidator.ts:8:  // # TODO Step 3: Move this to application/common/validation/sharedRules and keep presenters unaware of this base class.
src/utils/Formatter.ts:14:    // # TODO Step 1: Move this to domain/proceedings/ProceedingsSelection.ts option eligibility filtering.
src/utils/Formatter.ts:84:    // # TODO Step 1: Move this to domain/publicAuthority/PublicAuthoritySelection.ts option eligibility filtering.
src/utils/Formatter.ts:9:  // # TODO Step 5: Move this to separate presenter view mappers and application/domain selection policy helpers.
```

## Regenerate

```bash
cd /Users/ben.madley/Projects/laa-inquests-external-ui
grep -R -n "TODO Step" src | sort
```

