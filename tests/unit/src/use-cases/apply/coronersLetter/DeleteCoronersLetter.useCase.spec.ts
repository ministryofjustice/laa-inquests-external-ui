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

  it("returns DELETE_REJECTED when coronersLetterId is blank", async () => {
    const result = await useCase.execute({
      coronersLetterId: "",
      accessToken: deleteInput.accessToken,
    });

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
  });

  it("returns DELETE_REJECTED when the port rejects the delete", async () => {
    deleteCoronersLetterPort.deleteCoronersLetter.resolves({
      status: "DELETE_REJECTED",
    });

    const result = await useCase.execute(deleteInput);

    assert.deepEqual(result, {
      status: "DELETE_REJECTED",
    });
  });

  it("propagates a port rejection unchanged", async () => {
    const portError = new Error("network failure");
    deleteCoronersLetterPort.deleteCoronersLetter.rejects(portError);

    await assert.rejects(
      async () => useCase.execute(deleteInput),
      (error: unknown) => {
        assert.equal(error, portError);
        return true;
      },
    );
  });
});
