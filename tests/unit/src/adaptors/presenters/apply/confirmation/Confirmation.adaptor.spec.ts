import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ConfirmationAdaptor } from "#src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.js";
import { Formatter } from "#src/utils/Formatter.js";

describe("Confirmation adaptor", () => {
  it("render check your answers page", () => {
    const confirmationFormatter = new Formatter();
    const confirmationAdaptor = new ConfirmationAdaptor(confirmationFormatter);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    confirmationAdaptor.renderCheckYourAnswers(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/check-your-answers");
  });

  it("render check your answers page", () => {
    const confirmationFormatter = new Formatter();
    const confirmationAdaptor = new ConfirmationAdaptor(confirmationFormatter);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.session.clientFirstName = "test name";
    requestStub.session.clientLastName = "last name";
    requestStub.session.clientDobDay = "1";
    requestStub.session.clientDobMonth = "12";
    requestStub.session.clientDobYear = "1990";

    requestStub.session.clientAddressLine1 = "4 Privet Drive";
    requestStub.session.clientAddressLine2 = "";
    requestStub.session.clientTownOrcity = "Little Whinging";
    requestStub.session.clientCounty = "Surrey";
    requestStub.session.clientPostcode = "B1 123b";

    requestStub.session.clientCorrespondenceAddressLine1 = "1 test rd";
    requestStub.session.clientCorrespondenceAddressLine2 = "";
    requestStub.session.clientCorrespondenceTownOrcity = "test city";
    requestStub.session.clientCorrespondenceCounty = "test county";
    requestStub.session.clientCorrespondencePostcode = "B1 321b";

    requestStub.session.deceasedFirstName = "deceased first name";
    requestStub.session.deceasedLastName = "deceased last name";

    requestStub.session.deceasedDateOfDeathDay = "6";
    requestStub.session.deceasedDateOfDeathMonth = "8";
    requestStub.session.deceasedDateOfDeathYear = "2001";
    requestStub.session.deceasedClientRelationship = "brother";
    requestStub.session.deceasedCoronerReference = "12345678910";

    const publicAuthorities = [
      {
        publicAuthorityId: "12345",
        publicAuthorityDescription: "Test public authority",
      },
    ];

    const expectedFormattedPublicAuthorities = [
      {
        key: { text: "12345" },
        value: { text: "Test public authority" },
      },
    ];

    requestStub.session.selectedPublicAuthorities = publicAuthorities;

    confirmationAdaptor.renderCheckYourAnswers(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.deepEqual(renderArgs[1], {
      csrfToken: undefined,
      client: {
        clientFirstName: "test name",
        clientLastName: "last name",
        clientDob: "1/12/1990",
        clientAddress: "4 Privet Drive Little Whinging Surrey B1 123b",
        clientCorrespondenceAddress: "1 test rd test city test county B1 321b",
      },
      deceasedDetails: {
        deceasedFirstName: "deceased first name",
        deceasedLastName: "deceased last name",
        dateOfDeath: "6/8/2001",
        deceasedClientRelationship: "brother",
        deceasedCoronerReference: "12345678910",
      },
      publicAuthorities: expectedFormattedPublicAuthorities,
    });
  });

  it("render confirm success page", () => {
    const confirmationFormatter = new Formatter();
    const confirmationAdaptor = new ConfirmationAdaptor(confirmationFormatter);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    confirmationAdaptor.renderConfirmSuccess(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/confirm-success");
    assert.deepEqual(renderArgs[1], {
      csrfToken: undefined,
      applicationReferenceNumber: "",
    });
  });

  it("render confirm success page with application reference number", () => {
    const confirmationFormatter = new Formatter();
    const confirmationAdaptor = new ConfirmationAdaptor(confirmationFormatter);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.session.applicationReferenceNumber = "L-ABC-123";

    confirmationAdaptor.renderConfirmSuccess(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/confirm-success");
    assert.deepEqual(renderArgs[1], {
      csrfToken: undefined,
      applicationReferenceNumber: "L-ABC-123",
    });
  });

});
