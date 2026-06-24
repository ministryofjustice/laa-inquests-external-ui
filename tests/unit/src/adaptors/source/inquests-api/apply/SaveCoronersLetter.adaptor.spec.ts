import { assert } from "chai";
import { AxiosInstance } from "axios";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { UploadCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/UploadCoronersLetterAdaptor.js";
import { UploadCoronersLetterResponse } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/models/UploadCoronersLetter.types.js";

describe("UploadCoronersLetterAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let uploadCoronersLetterAdaptor: UploadCoronersLetterAdaptor;
  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.post.resolves({
      status: 201,
      data: { fileId: "test-file-id.pdf" },
    });

    uploadCoronersLetterAdaptor = new UploadCoronersLetterAdaptor(
      axiosStub,
      "http://localhost",
    );
  });

  const expectedSuccessResponse: UploadCoronersLetterResponse = {
    status: "SUCCESS",
    fileId: "test-file-id.pdf",
  };

  const expectedFailureResponse: UploadCoronersLetterResponse = {
    status: "TECHNICAL_FAILURE",
    reason: "UPSTREAM_REJECTED",
  };

  const expectedExceptionResponse: UploadCoronersLetterResponse = {
    status: "TECHNICAL_FAILURE",
    reason: "UNEXPECTED_EXCEPTION",
  };

  const submitBodyRaw = {
    buffer: Buffer.from("coroners-letter-content"),
    mimetype: "application/pdf",
    originalname: "coroners-letter.pdf",
  };

  it("returns a successful response on successful upload", async () => {
    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(submitBodyRaw);

    assert.deepEqual(expectedSuccessResponse, fileSaveResponse);
  });

  it("returns a technical failure response on failed upload", async () => {
    axiosStub.post.resolves({
      status: 500,
      data: {},
    });

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(submitBodyRaw);

    assert.deepEqual(expectedFailureResponse, fileSaveResponse);
  });

  it("returns a technical failure response on unexpected exception", async () => {
    axiosStub.post.rejects(new Error("Unexpected error"));

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(submitBodyRaw);

    assert.deepEqual(expectedExceptionResponse, fileSaveResponse);
  });

  it("calls correct api endpoint with parameters", async () => {
    await uploadCoronersLetterAdaptor.uploadCoronersLetter(submitBodyRaw);

    assert(axiosStub.post.calledOnce);

    const postCall = axiosStub.post.getCall(0);
    const actualUrl = postCall.args[0];
    const actualBody = postCall.args[1];

    assert.equal(
      actualUrl,
      "http://localhost/applications/upload-coroners-letter",
    );
    assert.instanceOf(actualBody, FormData);
  });
});
