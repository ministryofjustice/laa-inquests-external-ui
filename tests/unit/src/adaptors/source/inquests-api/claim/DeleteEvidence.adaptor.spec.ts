import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { DeleteEvidenceAdaptor } from "#src/adaptors/source/inquests-api/claim/DeleteEvidence/DeleteEvidence.adaptor.js";

describe("DeleteEvidenceAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: DeleteEvidenceAdaptor;

  const evidenceFileId = "evidence-id-1";

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.delete.resolves({
      status: 204,
      data: {},
    });

    adaptor = new DeleteEvidenceAdaptor(axiosStub, "http://localhost");
  });

  it("returns success for 204 responses", async () => {
    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("calls the correct delete endpoint with auth header", async () => {
    await adaptor.deleteEvidence({ evidenceFileId }, "token-123");

    assert.equal(axiosStub.delete.calledOnce, true);
    const deleteCall = axiosStub.delete.getCall(0);

    assert.equal(
      deleteCall.args[0],
      `http://localhost/claims/${evidenceFileId}`,
    );
    assert.deepEqual(deleteCall.args[1], {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
  });

  it("returns invalid input failure when upstream responds with 404", async () => {
    axiosStub.delete.resolves({ status: 404, data: {} });

    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns upstream rejected failure for non-204 responses", async () => {
    axiosStub.delete.resolves({ status: 500, data: {} });

    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns unexpected exception when request throws", async () => {
    axiosStub.delete.rejects(new Error("network error"));

    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
