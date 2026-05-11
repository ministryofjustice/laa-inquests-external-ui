import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ConfirmationAdaptor } from "#src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.js";

describe("Confirmation adaptor", () => {
  it("render check your answers page", () => {
    const confirmationAdaptor = new ConfirmationAdaptor();

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    confirmationAdaptor.renderCheckYourAnswers(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/check-your-answers");
  });

  it("render check your answers page", () => {
    const confirmationAdaptor = new ConfirmationAdaptor();

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.session.clientFirstName = "test name";
    requestStub.session.clientLastName = "last name";
    requestStub.session.clientDobDay = "1";
    requestStub.session.clientDobMonth = "12";
    requestStub.session.clientDobYear = "1990";

    requestStub.session.deceasedFirstName = "deceased first name";
    requestStub.session.deceasedLastName = "deceased last name";

    requestStub.session.deceasedDateOfDeathDay = "6";
    requestStub.session.deceasedDateOfDeathMonth = "8";
    requestStub.session.deceasedDateOfDeathYear = "2001";


    confirmationAdaptor.renderCheckYourAnswers(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.deepEqual(renderArgs[1], 
      { 
        csrfToken : undefined,
        client: {
          clientFirstName:"test name",
          clientLastName:"last name",
          clientDob: "1/12/1990"
        },
        deceasedDetails: {
          deceasedFirstName:"deceased first name",
          deceasedLastName:"deceased last name",
          dateOfDeath: "6/8/2001"
        }
      });
  });

});
