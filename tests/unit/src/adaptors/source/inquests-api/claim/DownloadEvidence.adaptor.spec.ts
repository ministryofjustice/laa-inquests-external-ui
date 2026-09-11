import { assert } from "chai";
import { AxiosInstance } from "axios";
import { Readable } from "node:stream";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { DownloadEvidenceAdaptor } from "#src/adaptors/source/inquests-api/claim/DownloadEvidence/DownloadEvidence.adaptor.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";
import { v4 as uuidv4 } from "uuid";

function axiosErrorWith(options: { status?: number; code?: string }): unknown {
  return Object.assign(new Error("upstream failure"), {
    isAxiosError: true,
    code: options.code,
    response:
      options.status === undefined ? undefined : { status: options.status },
  });
}

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

  it("returns NOT_FOUND when the api responds with 404", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 404 }));

    const response = await downloadEvidenceAdaptor.downloadEvidence(
      { claimEvidenceId: testEvidenceId, disposition: "inline" },
      "access-token-123",
    );

    assert.deepEqual(response, { status: "NOT_FOUND" });
  });

  it("throws AUTHENTICATION_REQUIRED without calling the api when token is missing", async () => {
    try {
      await downloadEvidenceAdaptor.downloadEvidence(
        { claimEvidenceId: testEvidenceId, disposition: "inline" },
        undefined,
      );
      assert.fail("expected ApplicationError");
    } catch (error) {
      assert.instanceOf(error, ApplicationError);
      assert.equal(
        (error as ApplicationError).type,
        APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
      );
    }
    assert.equal(axiosStub.get.callCount, 0);
  });

  it("throws UPSTREAM_UNAVAILABLE on a 5xx response", async () => {
    axiosStub.get.rejects(axiosErrorWith({ status: 502 }));

    try {
      await downloadEvidenceAdaptor.downloadEvidence(
        { claimEvidenceId: testEvidenceId, disposition: "attachment" },
        "access-token-123",
      );
      assert.fail("expected ApplicationError");
    } catch (error) {
      assert.instanceOf(error, ApplicationError);
      assert.equal(
        (error as ApplicationError).type,
        APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
      );
    }
  });

  it("throws UPSTREAM_UNAVAILABLE when the request fails with a network error", async () => {
    axiosStub.get.rejects(axiosErrorWith({ code: "ECONNREFUSED" }));

    try {
      await downloadEvidenceAdaptor.downloadEvidence(
        { claimEvidenceId: testEvidenceId, disposition: "inline" },
        "access-token-123",
      );
      assert.fail("expected ApplicationError");
    } catch (error) {
      assert.instanceOf(error, ApplicationError);
      assert.equal(
        (error as ApplicationError).type,
        APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
      );
    }
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
