import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";
import { v4 as uuidv4 } from "uuid";

describe("UploadCoronersLetterUseCase", () => {
  let uploadCoronersLetterPort: StubbedInstance<UploadCoronersLetterPort>;
  let useCase: UploadCoronersLetterUseCase;

  const testCoronersLetterId = uuidv4();
  const testCoronersLetterFileName = "test-coroners-letter.pdf";

  const testCoronerLetter = {
    buffer: Buffer.from("coroners-letter-content"),
    mimetype: "application/pdf",
    originalname: testCoronersLetterFileName,
    accessToken: "access-token-123",
  };

  beforeEach(() => {
    uploadCoronersLetterPort = stubInterface<UploadCoronersLetterPort>();
    useCase = new UploadCoronersLetterUseCase(uploadCoronersLetterPort);
  });

  it("returns success with laa reference when the API returns SUCCESS", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "SUCCESS",
      coronersLetterId: testCoronersLetterId,
      coronersLetterFileName: testCoronersLetterFileName,
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.equal(
      uploadCoronersLetterPort.uploadCoronersLetter.calledOnce,
      true,
    );
    assert.equal(
      uploadCoronersLetterPort.uploadCoronersLetter.getCall(0).args[1],
      testCoronerLetter.accessToken,
    );

    assert.deepEqual(result, {
      status: "SUCCESS",
      coronersLetterId: testCoronersLetterId,
      coronersLetterFileName: testCoronersLetterFileName,
    });
  });

  it("returns UPLOAD_REJECTED when the port rejects the upload", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "UPLOAD_REJECTED",
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "UPLOAD_REJECTED",
    });
  });

  it("returns FILE_SCAN_FOUND_VIRUS when the port reports a scan rejection", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "FILE_SCAN_FOUND_VIRUS",
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "FILE_SCAN_FOUND_VIRUS",
    });
  });

  it("propagates a port rejection unchanged", async () => {
    const portError = new Error("network failure");
    uploadCoronersLetterPort.uploadCoronersLetter.rejects(portError);

    await assert.rejects(
      async () => useCase.execute(testCoronerLetter),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
