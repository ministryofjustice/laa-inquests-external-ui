import { assert } from "chai";
import { AxiosInstance } from "axios";
import { StubbedInstance, stubInterface } from "ts-sinon";
import { SaveCoronersLetterAdaptor } from "#src/adaptors/source/inquests-api/apply/SaveCoronersLetter/SaveCoronersLetter.adaptor.js";

describe("SaveCoronersLetterAdaptor", () => {
  let axiosStub: StubbedInstance<AxiosInstance>;
  let saveCoronersLetterAdaptor: SaveCoronersLetterAdaptor;
  beforeEach(() => {
    axiosStub = stubInterface<AxiosInstance>();
    axiosStub.post.resolves({
      status: 201,
    });

    saveCoronersLetterAdaptor = new SaveCoronersLetterAdaptor(
      axiosStub,
      "http://localhost",
    );
  });
  const expectedApiResponse = {
    statusCode: 201,
  };

  const submitBodyRaw = {
    coronersLetter: "coroners-letter.pdf",
  };

  it("returns a successful response", async () => {
    const fileSaveResponse =
      await saveCoronersLetterAdaptor.saveCoronersLetter(submitBodyRaw);

    assert.deepEqual(expectedApiResponse, fileSaveResponse);
  });

  it("calls api correctly", async () => {
    const fileSaveResponse =
      await saveCoronersLetterAdaptor.saveCoronersLetter(submitBodyRaw);

    assert(axiosStub.post.calledOnce);

    const postCall = axiosStub.post.getCall(0);
    const actualUrl = postCall.args[0];
    const actualBody = postCall.args[1];

    assert.equal(
      actualUrl,
      "http://localhost/applications/save_coroners_letter",
    );
    assert.equal(actualBody, submitBodyRaw);
  });
});
