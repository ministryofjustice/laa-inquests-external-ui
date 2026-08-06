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

  it("returns technical failure when evidenceFileId is blank", async () => {
    const result = await useCase.execute({
      evidenceFileId: "",
      accessToken: deleteInput.accessToken,
    });

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns technical failure when API returns TECHNICAL_FAILURE", async () => {
    deleteEvidencePort.deleteEvidence.resolves({
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });

    const result = await useCase.execute(deleteInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns technical failure when adaptor throws", async () => {
    deleteEvidencePort.deleteEvidence.rejects(new Error("network failure"));

    const result = await useCase.execute(deleteInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
