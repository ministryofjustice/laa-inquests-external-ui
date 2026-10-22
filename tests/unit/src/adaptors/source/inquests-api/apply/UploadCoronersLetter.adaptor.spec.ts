import { assert } from "chai";
import { AxiosInstance } from "axios";
import { StubbedInstance, stubInterface } from "ts-sinon";
import * as Sentry from "@sentry/node";
import { UploadCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/UploadCoronersLetterAdaptor.js";
import { UploadCoronersLetterResponse } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/models/UploadCoronersLetter.types.js";
import { v4 as uuidv4 } from "uuid";

const TEST_DSN = "https://key@o0.ingest.sentry.io/1";

describe("UploadCoronersLetterAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let uploadCoronersLetterAdaptor: UploadCoronersLetterAdaptor;
  let capturedEvents: Record<string, unknown>[];
  const testCoronersLetterId = uuidv4();
  const testCoronersLetterFileName = "test-coroners-letter.pdf";

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.post.resolves({
      status: 201,
      data: {
        coronersLetterId: testCoronersLetterId,
        coronersLetterFileName: testCoronersLetterFileName,
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

    uploadCoronersLetterAdaptor = new UploadCoronersLetterAdaptor(
      axiosStub,
      "http://localhost",
    );
  });

  afterEach(async () => {
    await Sentry.close();
  });

  const expectedSuccessResponse: UploadCoronersLetterResponse = {
    status: "SUCCESS",
    coronersLetterId: testCoronersLetterId,
    coronersLetterFileName: testCoronersLetterFileName,
  };

  const expectedRejectedResponse: UploadCoronersLetterResponse = {
    status: "UPLOAD_REJECTED",
  };

  const expectedVirusFoundResponse: UploadCoronersLetterResponse = {
    status: "FILE_SCAN_FOUND_VIRUS",
  };

  const submitBodyRaw = {
    buffer: Buffer.from("coroners-letter-content"),
    mimetype: "application/pdf",
    originalname: testCoronersLetterFileName,
  };

  it("returns a successful response on successful upload", async () => {
    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );

    assert.deepEqual(expectedSuccessResponse, fileSaveResponse);
  });

  it("returns UPLOAD_REJECTED on a non-201/422 upstream response", async () => {
    axiosStub.post.resolves({
      status: 500,
      data: {},
    });

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );
    await Sentry.flush();

    assert.deepEqual(expectedRejectedResponse, fileSaveResponse);
    assert.equal(capturedEvents.length, 1);
  });

  it("returns UPLOAD_REJECTED on a malformed 201 payload", async () => {
    axiosStub.post.resolves({
      status: 201,
      data: { coronersLetterId: "" },
    });

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );
    await Sentry.flush();

    assert.deepEqual(expectedRejectedResponse, fileSaveResponse);
    assert.equal(capturedEvents.length, 1);
  });

  it("returns FILE_SCAN_FOUND_VIRUS on a 422 response without alerting Sentry", async () => {
    axiosStub.post.resolves({
      status: 422,
      data: {},
    });

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );
    await Sentry.flush();

    assert.deepEqual(expectedVirusFoundResponse, fileSaveResponse);
    assert.equal(capturedEvents.length, 0);
  });

  it("returns UPLOAD_REJECTED on unexpected exception", async () => {
    axiosStub.post.rejects(new Error("Unexpected error"));

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );
    await Sentry.flush();

    assert.deepEqual(expectedRejectedResponse, fileSaveResponse);
    assert.equal(capturedEvents.length, 1);
  });

  it("calls correct api endpoint with parameters", async () => {
    await uploadCoronersLetterAdaptor.uploadCoronersLetter(
      submitBodyRaw,
      "access-token-123",
    );

    assert(axiosStub.post.calledOnce);

    const postCall = axiosStub.post.getCall(0);
    const actualUrl = postCall.args[0];
    const actualBody = postCall.args[1];

    assert.equal(
      actualUrl,
      "http://localhost/applications/upload-coroners-letter",
    );
    assert.instanceOf(actualBody, FormData);
    const actualOptions = postCall.args[2] as {
      headers: Record<string, string>;
      validateStatus: (status: number) => boolean;
    };
    assert.deepEqual(actualOptions.headers, {
      Authorization: "Bearer access-token-123",
    });
    assert.isFunction(actualOptions.validateStatus);
    assert.isTrue(actualOptions.validateStatus(422));
  });
});
