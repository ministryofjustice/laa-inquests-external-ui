import { StubbedInstance, stubInterface } from "ts-sinon";
import { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import type { SaveCoronersLetterPort } from "#src/ports/source/inquests-api/SaveCoronersLetter.port.js";
import { strict as assert } from "assert";
import type { Request, Response } from "express";
import { SaveCoronersLetterRequest } from "#src/adaptors/source/inquests-api/apply/SaveCoronersLetter/models/SaveCoronersLetter.types.js";

describe("Coroners Letter adaptor", () => {
  let coronersLetterAdaptor: CoronersLetterAdaptor;
  let requestStub: StubbedInstance<Request>;
  let responseStub: StubbedInstance<Response>;

  const saveCoronersLetterPort = stubInterface<SaveCoronersLetterPort>();

  before(() => {
    coronersLetterAdaptor = new CoronersLetterAdaptor(saveCoronersLetterPort);
  });

  beforeEach(() => {
    requestStub = stubInterface<Request>();
    responseStub = stubInterface<Response>();
  });

  it("renders the coroners upload letter view with the correct arguments", () => {
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

  it("saves the file and redirects on 201", async () => {
    const testBuffer = Buffer.from("test-file-content");
    requestStub.file = {
      buffer: testBuffer,
      mimetype: "application/pdf",
      originalname: "test-file.pdf",
    } as Express.Multer.File;

    saveCoronersLetterPort.saveCoronersLetter.resolves({
      statusCode: 201,
      fileId: "test-file-id.pdf",
    });

    await coronersLetterAdaptor.processCoronersLetterUploadForm(
      requestStub,
      responseStub,
    );

    assert.equal(saveCoronersLetterPort.saveCoronersLetter.callCount, 1);

    const uploadBody = saveCoronersLetterPort.saveCoronersLetter.getCall(0)
      .args[0] as SaveCoronersLetterRequest;

    assert.deepEqual(uploadBody, {
      buffer: testBuffer,
      mimetype: "application/pdf",
      originalname: "test-file.pdf",
    });

    assert.equal(requestStub.session.coronersLetterFileId, "test-file-id.pdf");

    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(redirectArgs[0], "/apply/check-your-answers");
  });
});
