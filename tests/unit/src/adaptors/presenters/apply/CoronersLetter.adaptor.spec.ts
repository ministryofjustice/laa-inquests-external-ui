import { StubbedInstance, stubInterface } from "ts-sinon";
import { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import { strict as assert } from "assert";
import type { Request, Response } from "express";

describe("Coroners Letter adaptor", () => {
  let coronersLetterAdaptor: CoronersLetterAdaptor;
  let requestStub: StubbedInstance<Request>;
  let responseStub: StubbedInstance<Response>;

  before(() => {
    coronersLetterAdaptor = new CoronersLetterAdaptor();
  });

  beforeEach(() => {
    requestStub = stubInterface<Request>();
    responseStub = stubInterface<Response>();
  });

  it("renders the coroners upload letter view with the correct arguements", () => {
    requestStub.session.coronersLetterFile = "test-file";
    coronersLetterAdaptor.renderUploadCoronersLetterForm(
      requestStub,
      responseStub,
    );

    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/upload-coroners-letter");
    assert.deepEqual(renderArgs[1], {
      uploadedFile: "test-file",
    });
  });
});
