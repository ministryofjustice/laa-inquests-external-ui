import { assert } from "chai";
import { AxiosInstance } from "axios";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { UploadCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/UploadCoronersLetterAdaptor.js";
import { UploadCoronersLetterResponse } from "#src/adaptors/source/inquests-api/apply/UploadCoronersLetter/models/UploadCoronersLetter.types.js";
import { v4 as uuidv4 } from "uuid";

describe("UploadCoronersLetterAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let uploadCoronersLetterAdaptor: UploadCoronersLetterAdaptor;
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

    uploadCoronersLetterAdaptor = new UploadCoronersLetterAdaptor(
      axiosStub,
      "http://localhost",
    );
  });

  const expectedSuccessResponse: UploadCoronersLetterResponse = {
    status: "SUCCESS",
    coronersLetterId: testCoronersLetterId,
    coronersLetterFileName: testCoronersLetterFileName,
  };

  const expectedFailureResponse: UploadCoronersLetterResponse = {
    status: "TECHNICAL_FAILURE",
    reason: "UPSTREAM_REJECTED",
  };

  const expectedVirusFoundResponse: UploadCoronersLetterResponse = {
    status: "TECHNICAL_FAILURE",
    reason: "FILE_SCAN_FOUND_VIRUS",
  };

  const expectedExceptionResponse: UploadCoronersLetterResponse = {
    status: "TECHNICAL_FAILURE",
    reason: "UNEXPECTED_EXCEPTION",
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

  it("returns a technical failure response on failed upload", async () => {
    axiosStub.post.resolves({
      status: 500,
      data: {},
    });

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );

    assert.deepEqual(expectedFailureResponse, fileSaveResponse);
  });

  it("returns a technical failure response on failed upload", async () => {
    axiosStub.post.resolves({
      status: 422,
      data: {},
    });

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );

    assert.deepEqual(expectedVirusFoundResponse, fileSaveResponse);
  });

  it("returns a technical failure response on unexpected exception", async () => {
    axiosStub.post.rejects(new Error("Unexpected error"));

    const fileSaveResponse =
      await uploadCoronersLetterAdaptor.uploadCoronersLetter(
        submitBodyRaw,
        "access-token-123",
      );

    assert.deepEqual(expectedExceptionResponse, fileSaveResponse);
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
    assert.deepEqual(postCall.args[2], {
      headers: {
        Authorization: "Bearer access-token-123",
      },
    });
  });
});
