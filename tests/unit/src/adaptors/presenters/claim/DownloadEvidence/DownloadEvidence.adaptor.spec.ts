import { assert } from "chai";
import type { Request, Response } from "express";
import { Readable } from "node:stream";
import sinon from "sinon";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { DownloadEvidenceAdaptor } from "#src/adaptors/presenters/claim/DownloadEvidence/DownloadEvidence.adaptor.js";
import { DownloadEvidenceUseCase } from "#src/use-cases/claim/DownloadEvidence.useCase.js";
import { ERROR_PAGE_MESSAGE } from "#src/infrastructure/locales/constants.js";

describe("DownloadEvidenceAdaptor (presenter)", () => {
  let downloadEvidenceUseCase: StubbedInstance<DownloadEvidenceUseCase>;
  let adaptor: DownloadEvidenceAdaptor;
  let requestStub: StubbedInstance<Request>;
  let responseStub: StubbedInstance<Response>;
  let streamStub: StubbedInstance<Readable>;

  beforeEach(() => {
    downloadEvidenceUseCase = stubInterface<DownloadEvidenceUseCase>();
    adaptor = new DownloadEvidenceAdaptor(downloadEvidenceUseCase);

    requestStub = stubInterface<Request>();
    requestStub.params = { evidenceId: "evidence-id-1" };
    requestStub.session.accessToken = "token";

    responseStub = stubInterface<Response>();
    responseStub.status.returns(responseStub);

    streamStub = stubInterface<Readable>();
  });

  it("viewEvidence streams the file inline and sets headers", async () => {
    downloadEvidenceUseCase.execute.resolves({
      status: "SUCCESS",
      stream: streamStub,
      contentType: "application/pdf",
      contentDisposition: 'inline; filename="test.pdf"',
    });

    await adaptor.viewEvidence(requestStub, responseStub);

    assert.deepEqual(downloadEvidenceUseCase.execute.getCall(0).args[0], {
      claimEvidenceId: "evidence-id-1",
      disposition: "inline",
      accessToken: "token",
    });
    assert(
      responseStub.setHeader.calledWith("Content-Type", "application/pdf"),
    );
    assert(
      responseStub.setHeader.calledWith(
        "Content-Disposition",
        'inline; filename="test.pdf"',
      ),
    );
    assert(streamStub.pipe.calledOnceWithExactly(responseStub));
  });

  it("downloadEvidence streams the file as an attachment", async () => {
    downloadEvidenceUseCase.execute.resolves({
      status: "SUCCESS",
      stream: streamStub,
      contentType: "application/pdf",
      contentDisposition: 'attachment; filename="test.pdf"',
    });

    await adaptor.downloadEvidence(requestStub, responseStub);

    assert.equal(
      downloadEvidenceUseCase.execute.getCall(0).args[0].disposition,
      "attachment",
    );
    assert(streamStub.pipe.calledOnceWithExactly(responseStub));
  });

  it("renders the not found page when the evidence does not exist", async () => {
    downloadEvidenceUseCase.execute.resolves({
      status: "NOT_FOUND",
    });

    await adaptor.viewEvidence(requestStub, responseStub);

    assert(responseStub.status.calledOnceWithExactly(404));
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "main/error");
    const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
    assert.deepEqual(renderModel, {
      status: 404,
      message: ERROR_PAGE_MESSAGE.NOT_FOUND,
    });
    assert.equal(streamStub.pipe.callCount, 0);
  });

  it("propagates a technical failure instead of redirecting to /error", async () => {
    const failure = new Error("upstream unavailable");
    downloadEvidenceUseCase.execute.rejects(failure);

    let caught: unknown;
    try {
      await adaptor.downloadEvidence(requestStub, responseStub);
      assert.fail("expected rejection");
    } catch (error) {
      caught = error;
    }

    assert.equal(caught, failure);
    assert.equal(responseStub.redirect.callCount, 0);
    assert.equal(responseStub.render.callCount, 0);
    assert.equal(streamStub.pipe.callCount, 0);
  });

  afterEach(() => {
    sinon.restore();
  });
});
