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

    assert.deepEqual(result, {
      status: "SUCCESS",
      data: {
        coronersLetterId: testCoronersLetterId,
        coronersLetterFileName: testCoronersLetterFileName,
      },
    });
  });

  it("returns upstream TECHNICAL_FAILURE when API status is TECHNICAL_FAILURE", async () => {
    uploadCoronersLetterPort.uploadCoronersLetter.resolves({
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
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
