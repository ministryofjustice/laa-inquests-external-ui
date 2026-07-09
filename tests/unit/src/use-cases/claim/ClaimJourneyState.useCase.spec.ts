import { strict as assert } from "assert";
import { ClaimJourneyStateUseCase } from "#src/use-cases/claim/ClaimJourneyState.useCase.js";
import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";

describe("ClaimJourneyStateUseCase", () => {
  const useCase = new ClaimJourneyStateUseCase();

  it("returns CASE_SELECTION_INCOMPLETE when claim is missing", () => {
    const result = useCase.execute(undefined);

    assert.equal(result, ClaimJourneyState.CASE_SELECTION_INCOMPLETE);
  });

  it("returns CLAIM_TYPE_INCOMPLETE when type is missing", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      totalCostCompleted: true,
      evidenceCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.CLAIM_TYPE_INCOMPLETE);
  });

  it("returns CLAIM_SUBTYPE_INCOMPLETE for POA when subtype is missing", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      type: "PAYMENT_ON_ACCOUNT",
      typeCompleted: true,
      totalCostCompleted: true,
      evidenceCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE);
  });

  it("returns CLAIM_SUBTYPE_INCOMPLETE for POA when subtype exists but subtype step is not completed", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      type: "PAYMENT_ON_ACCOUNT",
      typeCompleted: true,
      subtype: "EXPERT_COST",
      subtypeCompleted: false,
      totalCostCompleted: true,
      evidenceCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE);
  });

  it("returns TOTAL_COST_INCOMPLETE when total cost is not complete", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      type: "FINAL_BILL",
      typeCompleted: true,
      evidenceCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.TOTAL_COST_INCOMPLETE);
  });

  it("returns EVIDENCE_INCOMPLETE when evidence is not complete", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      type: "FINAL_BILL",
      typeCompleted: true,
      totalCostCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.EVIDENCE_INCOMPLETE);
  });

  it("returns COMPLETE when all journey steps are complete", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      type: "PAYMENT_ON_ACCOUNT",
      typeCompleted: true,
      subtype: "EXPERT_COST",
      subtypeCompleted: true,
      totalCostCompleted: true,
      evidenceCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.COMPLETE);
  });

  it("returns CLAIM_TYPE_INCOMPLETE when type exists but type step is not completed", () => {
    const result = useCase.execute({
      caseReference: "ABC-12345",
      client: {
        reference: "ABC-12345",
        clientName: "Jane Smith",
        clientFirstName: "Jane",
        clientLastName: "Smith",
        dateOfBirth: "01/01/2000",
      },
      type: "FINAL_BILL",
      typeCompleted: false,
      totalCostCompleted: true,
      evidenceCompleted: true,
    });

    assert.equal(result, ClaimJourneyState.CLAIM_TYPE_INCOMPLETE);
  });
});
