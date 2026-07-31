import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { UploadEvidenceAdaptor } from "#src/adaptors/source/inquests-api/claim/UploadEvidence/UploadEvidence.adaptor.js";

describe("UploadEvidenceAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: UploadEvidenceAdaptor;

  const evidenceFileId = "evidence-id-1";
  const evidenceFileName = "evidence-file.pdf";

  const submitBodyRaw = {
    buffer: Buffer.from("evidence-content"),
    mimetype: "application/pdf",
    originalname: evidenceFileName,
  };

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.post.resolves({
      status: 201,
      data: {
        claimEvidenceId: evidenceFileId,
        claimEvidenceFileName: evidenceFileName,
      },
    });

    adaptor = new UploadEvidenceAdaptor(axiosStub, "http://localhost");
  });

  it("returns success with evidence file id and file name on successful upload", async () => {
    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");

    assert.deepEqual(result, {
      status: "SUCCESS",
      evidenceFileId,
      evidenceFileName,
    });
  });

  it("calls correct api endpoint with multipart body and auth header", async () => {
    await adaptor.uploadEvidence(submitBodyRaw, "token-123");

    assert.equal(axiosStub.post.calledOnce, true);
    const postCall = axiosStub.post.getCall(0);
    const actualUrl = postCall.args[0];
    const actualBody = postCall.args[1];

    assert.equal(actualUrl, "http://localhost/claims/evidence");
    assert.equal(actualBody instanceof FormData, true);
    assert.deepEqual(postCall.args[2], {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
  });

  it("returns technical failure when upstream responds with non-created status", async () => {
    axiosStub.post.resolves({ status: 500, data: {} });

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns virus scan technical failure on 422 response", async () => {
    axiosStub.post.resolves({ status: 422, data: {} });

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "FILE_SCAN_FOUND_VIRUS",
    });
  });

  it("returns technical failure on unexpected exception", async () => {
    axiosStub.post.rejects(new Error("network error"));

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });

  it("returns technical failure when the API payload is malformed", async () => {
    axiosStub.post.resolves({
      status: 201,
      data: {
        claimEvidenceFileName: evidenceFileName,
      },
    });

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
