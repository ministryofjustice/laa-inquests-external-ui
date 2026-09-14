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
      evidenceFileId,
      evidenceFileName,
    });
  });

  it("returns UPLOAD_REJECTED when the port rejects the upload", async () => {
    uploadEvidencePort.uploadEvidence.resolves({
      status: "UPLOAD_REJECTED",
    });

    const result = await useCase.execute(uploadInput);

    assert.deepEqual(result, {
      status: "UPLOAD_REJECTED",
    });
  });

  it("returns FILE_SCAN_FOUND_VIRUS when the port reports a scan rejection", async () => {
    uploadEvidencePort.uploadEvidence.resolves({
      status: "FILE_SCAN_FOUND_VIRUS",
    });

    const result = await useCase.execute(uploadInput);

    assert.deepEqual(result, {
      status: "FILE_SCAN_FOUND_VIRUS",
    });
  });

  it("propagates a port rejection unchanged", async () => {
    const portError = new Error("network failure");
    uploadEvidencePort.uploadEvidence.rejects(portError);

    await assert.rejects(
      async () => useCase.execute(uploadInput),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
