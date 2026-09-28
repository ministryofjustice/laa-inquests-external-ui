import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { ListClaimsPort } from "#src/ports/source/inquests-api/ListClaims.port.js";
import { SelectCaseUseCase } from "#src/use-cases/claim/SelectCase.useCase.js";

const storedClient = {
  reference: "INQ-1",
  clientName: "Jane Smith",
  clientFirstName: "Jane",
  clientLastName: "Smith",
  dateOfBirth: "01/01/2000",
};

describe("SelectCaseUseCase", () => {
  let listClaimsPort: StubbedInstance<ListClaimsPort>;
  let useCase: SelectCaseUseCase;

  beforeEach(() => {
    listClaimsPort = stubInterface<ListClaimsPort>();
    listClaimsPort.listClaims.resolves([]);
    useCase = new SelectCaseUseCase(listClaimsPort);
  });

  it("returns NOT_FOUND when the reference is not in the search results", async () => {
    const result = await useCase.execute("INQ-2", [storedClient], "token-123");

    assert.deepEqual(result, { status: "NOT_FOUND" });
    assert.equal(listClaimsPort.listClaims.callCount, 0);
  });

  it("queries both the unassessed and assessed claim lists", async () => {
    await useCase.execute("INQ-1", [storedClient], "access-token-123");

    assert.equal(
      listClaimsPort.listClaims.calledWith("INQ-1", false, "access-token-123"),
      true,
    );
    assert.equal(
      listClaimsPort.listClaims.calledWith("INQ-1", true, "access-token-123"),
      true,
    );
  });

  it("returns ALLOWED with the selected client when there are no claims", async () => {
    const result = await useCase.execute(
      "INQ-1",
      [storedClient],
      "access-token-123",
    );

    assert.deepEqual(result, { status: "ALLOWED", client: storedClient });
  });

  it("returns BLOCKED when a submitted final bill exists", async () => {
    listClaimsPort.listClaims
      .withArgs("INQ-1", false, "access-token-123")
      .resolves([{ claimTypeId: "FINAL_BILL", statusId: "SUBMITTED" }]);

    const result = await useCase.execute(
      "INQ-1",
      [storedClient],
      "access-token-123",
    );

    assert.deepEqual(result, { status: "BLOCKED", client: storedClient });
  });

  it("returns BLOCKED when a pay-in-full nil bill exists", async () => {
    listClaimsPort.listClaims
      .withArgs("INQ-1", true, "access-token-123")
      .resolves([{ claimTypeId: "NIL_BILL", statusId: "PAY_IN_FULL" }]);

    const result = await useCase.execute(
      "INQ-1",
      [storedClient],
      "access-token-123",
    );

    assert.deepEqual(result, { status: "BLOCKED", client: storedClient });
  });

  it("returns ALLOWED when only a payment on account claim is submitted", async () => {
    listClaimsPort.listClaims
      .withArgs("INQ-1", false, "access-token-123")
      .resolves([{ claimTypeId: "PAYMENT_ON_ACCOUNT", statusId: "SUBMITTED" }]);

    const result = await useCase.execute(
      "INQ-1",
      [storedClient],
      "access-token-123",
    );

    assert.deepEqual(result, { status: "ALLOWED", client: storedClient });
  });

  it("returns ALLOWED when a final bill has been rejected", async () => {
    listClaimsPort.listClaims
      .withArgs("INQ-1", true, "access-token-123")
      .resolves([{ claimTypeId: "FINAL_BILL", statusId: "REJECTED" }]);

    const result = await useCase.execute(
      "INQ-1",
      [storedClient],
      "access-token-123",
    );

    assert.deepEqual(result, { status: "ALLOWED", client: storedClient });
  });

  it("propagates the port error unchanged", async () => {
    const portError = new Error("upstream unavailable");
    listClaimsPort.listClaims.rejects(portError);

    await assert.rejects(
      async () => useCase.execute("INQ-1", [storedClient], "access-token-123"),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
