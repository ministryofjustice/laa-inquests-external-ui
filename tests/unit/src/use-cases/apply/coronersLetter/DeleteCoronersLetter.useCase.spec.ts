import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { DeleteCoronersLetterPort } from "#src/ports/source/inquests-api/DeleteCoronersLetter.port.js";
import { DeleteCoronersLetterUseCase } from "#src/use-cases/apply/coronersLetter/DeleteCoronersLetter.useCase.js";

describe("DeleteCoronersLetterUseCase", () => {
  let deleteCoronersLetterPort: StubbedInstance<DeleteCoronersLetterPort>;
  let useCase: DeleteCoronersLetterUseCase;

  const deleteInput = {
    coronersLetterId: "coroners-letter-id-1",
    accessToken: "access-token-123",
  };

  beforeEach(() => {
    deleteCoronersLetterPort = stubInterface<DeleteCoronersLetterPort>();
    useCase = new DeleteCoronersLetterUseCase(deleteCoronersLetterPort);
  });

  it("returns success when the delete coroners letter API returns SUCCESS", async () => {
    deleteCoronersLetterPort.deleteCoronersLetter.resolves({
      status: "SUCCESS",
    });

    const result = await useCase.execute(deleteInput);

    assert.equal(
      deleteCoronersLetterPort.deleteCoronersLetter.calledOnce,
      true,
    );
    assert.equal(
      deleteCoronersLetterPort.deleteCoronersLetter.getCall(0).args[1],
      deleteInput.accessToken,
    );

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("returns technical failure when coronersLetterId is blank", async () => {
    const result = await useCase.execute({
      coronersLetterId: "",
      accessToken: deleteInput.accessToken,
    });

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns technical failure when API returns TECHNICAL_FAILURE", async () => {
    deleteCoronersLetterPort.deleteCoronersLetter.resolves({
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });

    const result = await useCase.execute(deleteInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns technical failure when adaptor throws", async () => {
    deleteCoronersLetterPort.deleteCoronersLetter.rejects(
      new Error("network failure"),
    );

    const result = await useCase.execute(deleteInput);

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
