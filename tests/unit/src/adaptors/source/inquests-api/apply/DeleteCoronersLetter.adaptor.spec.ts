import { strict as assert } from "assert";
import type { AxiosInstance } from "axios";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { DeleteCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/DeleteCoronersLetter/DeleteCoronersLetter.adaptor.js";

describe("DeleteCoronersLetterAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let adaptor: DeleteCoronersLetterAdaptor;

  const coronersLetterId = "coroners-letter-id-1";

  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.delete.resolves({
      status: 204,
      data: {},
    });

    adaptor = new DeleteCoronersLetterAdaptor(axiosStub, "http://localhost");
  });

  it("returns success for 204 responses", async () => {
    const result = await adaptor.deleteCoronersLetter(
      { coronersLetterId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "SUCCESS",
    });
  });

  it("calls the coroners letter delete endpoint with auth header", async () => {
    await adaptor.deleteCoronersLetter({ coronersLetterId }, "token-123");

    assert.equal(axiosStub.delete.calledOnce, true);
    const deleteCall = axiosStub.delete.getCall(0);

    assert.equal(
      deleteCall.args[0],
      `http://localhost/applications/coroners-letter/${coronersLetterId}`,
    );
    assert.deepEqual(deleteCall.args[1], {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
  });

  it("returns invalid input failure when upstream responds with 404", async () => {
    axiosStub.delete.resolves({ status: 404, data: {} });

    const result = await adaptor.deleteCoronersLetter(
      { coronersLetterId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "INVALID_INPUT_STATE",
    });
  });

  it("returns upstream rejected failure for other non-204 responses", async () => {
    axiosStub.delete.resolves({ status: 500, data: {} });

    const result = await adaptor.deleteCoronersLetter(
      { coronersLetterId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UPSTREAM_REJECTED",
    });
  });

  it("returns unexpected exception failure when the request throws", async () => {
    axiosStub.delete.rejects(new Error("network failure"));

    const result = await adaptor.deleteCoronersLetter(
      { coronersLetterId },
      "token-123",
    );

    assert.deepEqual(result, {
      status: "TECHNICAL_FAILURE",
      reason: "UNEXPECTED_EXCEPTION",
    });
  });
});
