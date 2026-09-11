import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { DeleteEvidencePort } from "#src/ports/source/inquests-api/DeleteEvidence.port.js";
import { DeleteEvidenceUseCase } from "#src/use-cases/claim/DeleteEvidence.useCase.js";

describe("DeleteEvidenceUseCase", () => {
  let deleteEvidencePort: StubbedInstance<DeleteEvidencePort>;
  let useCase: DeleteEvidenceUseCase;

  const deleteInput = {
    evidenceFileId: "evidence-id-1",
    accessToken: "access-token-123",
  };

  beforeEach(() => {
    deleteEvidencePort = stubInterface<DeleteEvidencePort>();
    useCase = new DeleteEvidenceUseCase(deleteEvidencePort);
  });

  it("returns success when the delete evidence API returns SUCCESS", async () => {
    deleteEvidencePort.deleteEvidence.resolves({
      status: "SUCCESS",
    });

    const result = await useCase.execute(deleteInput);

    assert.equal(deleteEvidencePort.deleteEvidence.calledOnce, true);
    assert.equal(
      deleteEvidencePort.deleteEvidence.getCall(0).args[1],
      deleteInput.accessToken,
    );

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("returns DELETE_REJECTED when evidenceFileId is blank", async () => {
    const result = await useCase.execute({
      evidenceFileId: "",
      accessToken: deleteInput.accessToken,
    });

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
  });

  it("returns DELETE_REJECTED when the port rejects the delete", async () => {
    deleteEvidencePort.deleteEvidence.resolves({
      status: "DELETE_REJECTED",
    });

    const result = await useCase.execute(deleteInput);

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
  });

  it("propagates a port rejection unchanged", async () => {
    const portError = new Error("network failure");
    deleteEvidencePort.deleteEvidence.rejects(portError);

    await assert.rejects(
      async () => useCase.execute(deleteInput),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
