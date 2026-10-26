import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import * as Sentry from "@sentry/node";
import { DeleteEvidenceAdaptor } from "#src/adaptors/source/inquests-api/claim/DeleteEvidence/DeleteEvidence.adaptor.js";

const TEST_DSN = "https://key@o0.ingest.sentry.io/1";

describe("DeleteEvidenceAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: DeleteEvidenceAdaptor;
  let capturedEvents: Record<string, unknown>[];

  const evidenceFileId = "evidence-id-1";

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.delete.resolves({
      status: 204,
      data: {},
    });

    capturedEvents = [];
    Sentry.init({
      dsn: TEST_DSN,
      transport: () => ({
        send: async (envelope) => {
          const [, items] = envelope;
          for (const [header, payload] of items) {
            if ((header as { type: string }).type === "event") {
              capturedEvents.push(payload as Record<string, unknown>);
            }
          }
          return {};
        },
        flush: async () => true,
      }),
    });

    adaptor = new DeleteEvidenceAdaptor(axiosStub, "http://localhost");
  });

  afterEach(async () => {
    await Sentry.close();
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

  it("returns DELETE_REJECTED when upstream responds with 404", async () => {
    axiosStub.delete.resolves({ status: 404, data: {} });

    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
    assert.equal(capturedEvents.length, 1);
  });

  it("returns DELETE_REJECTED for non-204 responses", async () => {
    axiosStub.delete.resolves({ status: 500, data: {} });

    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
    assert.equal(capturedEvents.length, 1);
  });

  it("returns DELETE_REJECTED when request throws", async () => {
    axiosStub.delete.rejects(new Error("network error"));

    const result = await adaptor.deleteEvidence(
      { evidenceFileId },
      "token-123",
    );
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
    assert.equal(capturedEvents.length, 1);
  });
});
