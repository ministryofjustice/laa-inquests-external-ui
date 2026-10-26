import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import * as Sentry from "@sentry/node";
import { UploadEvidenceAdaptor } from "#src/adaptors/source/inquests-api/claim/UploadEvidence/UploadEvidence.adaptor.js";

const TEST_DSN = "https://key@o0.ingest.sentry.io/1";

describe("UploadEvidenceAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: UploadEvidenceAdaptor;
  let capturedEvents: Record<string, unknown>[];

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

    adaptor = new UploadEvidenceAdaptor(axiosStub, "http://localhost");
  });

  afterEach(async () => {
    await Sentry.close();
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
    const options = postCall.args[2] as {
      headers: Record<string, string>;
      validateStatus: (status: number) => boolean;
    };
    assert.deepEqual(options.headers, {
      Authorization: "Bearer token-123",
    });
    assert.equal(typeof options.validateStatus, "function");
  });

  it("returns UPLOAD_REJECTED when upstream responds with a non-created status", async () => {
    axiosStub.post.resolves({ status: 500, data: {} });

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "UPLOAD_REJECTED",
    });
    assert.equal(capturedEvents.length, 1);
  });

  it("returns FILE_SCAN_FOUND_VIRUS on a 422 response without alerting Sentry", async () => {
    axiosStub.post.resolves({ status: 422, data: {} });

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "FILE_SCAN_FOUND_VIRUS",
    });
    assert.equal(capturedEvents.length, 0);
  });

  it("returns UPLOAD_REJECTED on unexpected exception", async () => {
    axiosStub.post.rejects(new Error("network error"));

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "UPLOAD_REJECTED",
    });
    assert.equal(capturedEvents.length, 1);
  });

  it("returns UPLOAD_REJECTED when the API payload is malformed", async () => {
    axiosStub.post.resolves({
      status: 201,
      data: {
        claimEvidenceFileName: evidenceFileName,
      },
    });

    const result = await adaptor.uploadEvidence(submitBodyRaw, "token-123");
    await Sentry.flush();

    assert.deepEqual(result, {
      status: "UPLOAD_REJECTED",
    });
    assert.equal(capturedEvents.length, 1);
  });
});
