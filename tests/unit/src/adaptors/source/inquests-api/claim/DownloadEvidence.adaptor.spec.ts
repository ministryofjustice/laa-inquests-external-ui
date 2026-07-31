import { assert } from "chai";
import { AxiosInstance } from "axios";
import { Readable } from "node:stream";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { DownloadEvidenceAdaptor } from "#src/adaptors/source/inquests-api/claim/DownloadEvidence/DownloadEvidence.adaptor.js";
import { v4 as uuidv4 } from "uuid";

describe("DownloadEvidenceAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let downloadEvidenceAdaptor: DownloadEvidenceAdaptor;
  const testEvidenceId = uuidv4();
  const testStream = Readable.from(["mock evidence content"]);

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.get.resolves({
      status: 200,
      data: testStream,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'inline; filename="test-evidence.pdf"',
      },
    });

    downloadEvidenceAdaptor = new DownloadEvidenceAdaptor(
      axiosStub,
      "http://localhost",
    );
  });

  it("returns a successful response with the stream and headers", async () => {
    const response = await downloadEvidenceAdaptor.downloadEvidence(
      { claimEvidenceId: testEvidenceId, disposition: "inline" },
      "access-token-123",
    );

    assert.deepEqual(response, {
      status: "SUCCESS",
      stream: testStream,
      contentType: "application/pdf",
      contentDisposition: 'inline; filename="test-evidence.pdf"',
    });
  });

  it("returns a NOT_FOUND technical failure when the api responds with 404", async () => {
    axiosStub.get.resolves({ status: 404, data: {}, headers: {} });

    const response = await downloadEvidenceAdaptor.downloadEvidence(
      { claimEvidenceId: testEvidenceId, disposition: "inline" },
      "access-token-123",
    );

    assert.deepEqual(response, {
      status: "TECHNICAL_FAILURE",
      reason: "NOT_FOUND",
    });
  });

  it("returns an UPSTREAM_REJECTED technical failure on other non-200 responses", async () => {
    axiosStub.get.resolves({ status: 500, data: {}, headers: {} });

    const response = await downloadEvidenceAdaptor.downloadEvidence(
      { claimEvidenceId: testEvidenceId, disposition: "attachment" },
      "access-token-123",
    );

    assert.deepEqual(response, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns an UNEXPECTED_EXCEPTION technical failure when the request throws", async () => {
    axiosStub.get.rejects(new Error("Unexpected error"));

    const response = await downloadEvidenceAdaptor.downloadEvidence(
      { claimEvidenceId: testEvidenceId, disposition: "inline" },
      "access-token-123",
    );

    assert.deepEqual(response, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });

  it("calls the correct api endpoint with parameters", async () => {
    await downloadEvidenceAdaptor.downloadEvidence(
      { claimEvidenceId: testEvidenceId, disposition: "attachment" },
      "access-token-123",
    );

    assert(axiosStub.get.calledOnce);

    const getCall = axiosStub.get.getCall(0);
    assert.equal(getCall.args[0], `http://localhost/claims/${testEvidenceId}`);

    const config = getCall.args[1];
    assert.deepEqual(config?.params, { disposition: "attachment" });
    assert.equal(config?.responseType, "stream");
    assert.deepEqual(config?.headers, {
      Authorization: "Bearer access-token-123",
    });
  });
});
