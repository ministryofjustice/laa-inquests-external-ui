import { assert } from "chai";
import { Readable } from "node:stream";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { DownloadEvidenceUseCase } from "#src/use-cases/claim/DownloadEvidence.useCase.js";
import type { DownloadEvidencePort } from "#src/ports/source/inquests-api/DownloadEvidence.port.js";

describe("DownloadEvidenceUseCase", () => {
  let downloadEvidencePort: StubbedInstance<DownloadEvidencePort>;
  let useCase: DownloadEvidenceUseCase;
  const testStream = Readable.from(["mock evidence content"]);

  beforeEach(() => {
    downloadEvidencePort = stubInterface<DownloadEvidencePort>();
    useCase = new DownloadEvidenceUseCase(downloadEvidencePort);
  });

  it("maps a successful port response to a SUCCESS result", async () => {
    downloadEvidencePort.downloadEvidence.resolves({
      status: "SUCCESS",
      stream: testStream,
      contentType: "application/pdf",
      contentDisposition: "inline",
    });

    const result = await useCase.execute({
      claimEvidenceId: "evidence-id-1",
      disposition: "inline",
      accessToken: "token",
    });

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        stream: testStream,
        contentType: "application/pdf",
        contentDisposition: "inline",
      },
    });
  });

  it("passes the request and access token to the port", async () => {
    downloadEvidencePort.downloadEvidence.resolves({
      status: "SUCCESS",
      stream: testStream,
      contentType: "application/pdf",
      contentDisposition: "attachment",
    });

    await useCase.execute({
      claimEvidenceId: "evidence-id-1",
      disposition: "attachment",
      accessToken: "token",
    });

    assert(
      downloadEvidencePort.downloadEvidence.calledOnceWithExactly(
        { claimEvidenceId: "evidence-id-1", disposition: "attachment" },
        "token",
      ),
    );
  });

  it("maps a NOT_FOUND port failure to a TECHNICAL_FAILURE result", async () => {
    downloadEvidencePort.downloadEvidence.resolves({
      status: "TECHNICAL_FAILURE",
      reason: "NOT_FOUND",
    });

    const result = await useCase.execute({
      claimEvidenceId: "missing",
      disposition: "inline",
      accessToken: "token",
    });

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "NOT_FOUND",
    });
  });

  it("maps an UNEXPECTED_EXCEPTION port failure to a TECHNICAL_FAILURE result", async () => {
    downloadEvidencePort.downloadEvidence.resolves({
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });

    const result = await useCase.execute({
      claimEvidenceId: "evidence-id-1",
      disposition: "inline",
      accessToken: "token",
    });

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
