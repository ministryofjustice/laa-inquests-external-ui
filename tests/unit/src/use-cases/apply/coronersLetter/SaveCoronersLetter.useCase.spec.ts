import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";
import { SaveCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/SaveCoronersLetter.useCase.js";
import { HTTP_CREATED } from "#src/infrastructure/locales/constants.js";

describe("SaveCoronersLetterUseCase", () => {
  let saveCoronersLetterPort: StubbedInstance<SaveCoronersLetterPort>;
  let useCase: SaveCoronersLetterUseCase;
  const testCoronerLetter = {
    fileName: "coroners-letter.pdf",
  };

  beforeEach(() => {
    saveCoronersLetterPort = stubInterface<SaveCoronersLetterPort>();
    useCase = new SaveCoronersLetterUseCase(saveCoronersLetterPort);
  });

  it("returns success with laa reference when the API returns HTTP_CREATED", async () => {
    saveCoronersLetterPort.saveCoronersLetter.resolves({
      statusCode: HTTP_CREATED,
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("returns upstream rejected when API status code is not HTTP_CREATED", async () => {
    saveCoronersLetterPort.saveCoronersLetter.resolves({
      statusCode: 500,
    });

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns unexpected exception when adapter throws", async () => {
    saveCoronersLetterPort.saveCoronersLetter.rejects(
      new Error("network failure"),
    );

    const result = await useCase.execute(testCoronerLetter);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
