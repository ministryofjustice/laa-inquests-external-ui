import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { UploadEvidencePort } from "#src/ports/source/inquests-api/UploadEvidence.port.js";
import { UploadEvidenceUseCase } from "#src/use-cases/claim/UploadEvidence.useCase.js";

describe("UploadEvidenceUseCase", () => {
  let uploadEvidencePort: StubbedInstance<UploadEvidencePort>;
  let useCase: UploadEvidenceUseCase;

  const evidenceFileId = "evidence-id-1";
  const evidenceFileName = "evidence-file.pdf";

  const uploadInput = {
    buffer: Buffer.from("evidence-content"),
    mimetype: "application/pdf",
    originalname: evidenceFileName,
    accessToken: "access-token-123",
  };

  beforeEach(() => {
    uploadEvidencePort = stubInterface<UploadEvidencePort>();
    useCase = new UploadEvidenceUseCase(uploadEvidencePort);
  });

  it("returns success when the upload evidence API returns SUCCESS", async () => {
    uploadEvidencePort.uploadEvidence.resolves({
      status: "SUCCESS",
      evidenceFileId,
      evidenceFileName,
    });

    const result = await useCase.execute(uploadInput);

    assert.equal(uploadEvidencePort.uploadEvidence.calledOnce, true);
    assert.equal(
      uploadEvidencePort.uploadEvidence.getCall(0).args[1],
      uploadInput.accessToken,
    );

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        evidenceFileId,
        evidenceFileName,
      },
    });
  });

  it("returns technical failure when the API returns TECHNICAL_FAILURE", async () => {
    uploadEvidencePort.uploadEvidence.resolves({
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });

    const result = await useCase.execute(uploadInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns technical failure when the API returns success with missing evidenceFileId", async () => {
    uploadEvidencePort.uploadEvidence.resolves({
      status: "SUCCESS",
      evidenceFileId: "",
      evidenceFileName,
    });

    const result = await useCase.execute(uploadInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });

  it("returns technical failure when the adaptor throws an exception", async () => {
    uploadEvidencePort.uploadEvidence.rejects(new Error("network failure"));

    const result = await useCase.execute(uploadInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
