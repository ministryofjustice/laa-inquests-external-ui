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
      stream: testStream,
      contentType: "application/pdf",
      contentDisposition: "inline",
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

  it("returns the NOT_FOUND value from the port unchanged", async () => {
    downloadEvidencePort.downloadEvidence.resolves({
      status: "NOT_FOUND",
    });

    const result = await useCase.execute({
      claimEvidenceId: "missing",
      disposition: "inline",
      accessToken: "token",
    });

    assert.deepEqual(result, {
      status: "NOT_FOUND",
    });
  });

  it("propagates a port rejection unchanged", async () => {
    const portError = new Error("upstream unavailable");
    downloadEvidencePort.downloadEvidence.rejects(portError);

    let caught: unknown;
    try {
      await useCase.execute({
        claimEvidenceId: "evidence-id-1",
        disposition: "inline",
        accessToken: "token",
      });
      assert.fail("expected rejection");
    } catch (error) {
      caught = error;
    }
    assert.equal(caught, portError);
  });
});
