import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { UploadCoronersLetterPort } from "#src/ports/source/inquests-api/UploadCoronersLetter.port.js";
import { UploadCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/UploadCoronersLetter.useCase.js";

describe("UploadCoronersLetterUseCase", () => {
  let uploadCoronersLetterPort: StubbedInstance<UploadCoronersLetterPort>;
  let useCase: UploadCoronersLetterUseCase;
  const testCoronerLetter = {
    buffer: Buffer.from("coroners-letter-content"),
    mimetype: "application/pdf",
    originalname: "coroners-letter.pdf",
  };

  beforeEach(() => {
    uploadCoronersLetterPort = stubInterface<UploadCoronersLetterPort>();
    useCase = new UploadCoronersLetterUseCase(uploadCoronersLetterPort);
  });

  it("returns success with laa reference when the API returns SUCCESS", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "SUCCESS",
      fileId: "test-file-id.pdf",
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: { fileId: "test-file-id.pdf" },
    });
  });

  it("returns upstream rejected when API status is not SUCCESS", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "FAILURE",
      fileId: "",
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns unexpected exception when adapter throws", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.rejects(
      new Error("network failure"),
    );

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
