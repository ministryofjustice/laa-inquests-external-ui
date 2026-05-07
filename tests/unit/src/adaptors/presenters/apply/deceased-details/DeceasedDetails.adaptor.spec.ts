import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response, Locals } from "express";
import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { DeceasedDetailsAdaptor } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.js";
import { DeceasedDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";

describe("Deceased details adaptor", () => {
  it("render name form", () => {
    const formValidator = new DeceasedDetailsValidator();
    const deceasedDetailsAdaptor = new DeceasedDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    deceasedDetailsAdaptor.renderNameForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/deceased-details/name");
  });

  it("process name form redirects to dod", () => {
    const formValidator = new DeceasedDetailsValidator();
    const deceasedDetailsAdaptor = new DeceasedDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.body = {
      _csrf: "abcdefg",
      "deceased-first-name": "Test",
      "deceased-last-name": "test",
    };

    deceasedDetailsAdaptor.processNameForm(requestStub, responseStub);
    assert.equal(responseStub.redirect.callCount, 1);
    const renderArgs = responseStub.redirect.getCall(0).args;
    assert.equal(renderArgs[0], "/apply/deceased-details/dod");
  });

  it("process name re-renders name on bad input with errors", () => {
    const formValidator = new DeceasedDetailsValidator();
    const deceasedDetailsAdaptor = new DeceasedDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.body = {
      _csrf: "abcdefg",
      "deceased-first-name": "",
      "deceased-last-name": "",
    };

    deceasedDetailsAdaptor.processNameForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/deceased-details/name");

    const errorObject = renderArgs[1] as Object;
    assert.ok(errorObject.hasOwnProperty("errorSummaries"));
  });
});
