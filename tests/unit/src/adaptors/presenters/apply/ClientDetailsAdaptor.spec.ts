import { strict as assert } from "assert";
import sinon from "sinon";
import { type StubbedInstance, stubInterface, stubObject } from "ts-sinon";
import type { Request, Response, Locals } from "express";
import { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";
import { FormValidator } from "#src/utils/FormValidator.js";

describe("Client details adaptor", () => {
  it("render name and dob form", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.renderNameForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/client-details/name-and-dob");
  });

  it("process name and dob form redirects to nino", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();
    requestStub.body = {
      _csrf: "abcdefg",
      "first-name": "hev",
      "last-name": "iscool",
      "last-name-at-birth": "",
      "dob-day": "1",
      "dob-month": "1",
      "dob-year": "1900",
      "name-change": "false",
    };

    clientDetailsAdaptor.processNameForm(requestStub, responseStub);
    assert.equal(responseStub.redirect.callCount, 1);
    const renderArgs = responseStub.redirect.getCall(0).args;
    assert.equal(renderArgs[0], "/apply/client-details/nino");
  });

  it("process name and dob form adds client name details to session", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      _csrf: "abcdefg",
      "first-name": "jim",
      "last-name": "halpert",
      "last-name-at-birth": "",
      "name-change": "false",
    };

    clientDetailsAdaptor.processNameForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientFirstName, "jim");
    assert.equal(requestStub.session.clientLastName, "halpert");
    assert.equal(requestStub.session.clientLastNameAtBirth, "");
    assert.equal(requestStub.session.hasNameChanged, "false");
  });

  it("render nino form", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.renderNinoForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/client-details/nino");
  });

  it("process nino form redirects to has prev application", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = { "has-nino": "true", "nino-input": "PC345678A" };

    clientDetailsAdaptor.processNinoForm(requestStub, responseStub);
    assert.equal(responseStub.redirect.callCount, 1);
    const renderArgs = responseStub.redirect.getCall(0).args;
    assert.equal(renderArgs[0], "/apply/client-details/has-prev-application");
  });

  it("process nino form adds nino to session when nino exists", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = { "has-nino": "true", "nino-input": "123456789" };

    clientDetailsAdaptor.processNinoForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientNino, "123456789");
  });

  it("process nino form set nino to null in session when nino does not exist", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = { "has-nino": "false", "nino-input": "" };

    clientDetailsAdaptor.processNinoForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientNino, null);
  });

  it("render has prev application form", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.renderHasPrevApplicationForm(
      requestStub,
      responseStub,
    );
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/client-details/has-prev-application");
  });

  it("process has prev application form redirects to proceedings", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.processHasPrevApplicationForm(
      requestStub,
      responseStub,
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const renderArgs = responseStub.redirect.getCall(0).args;
    assert.equal(renderArgs[0], "/apply/proceedings");
  });

  it("process has prev application form sets boolean value to false in session when previous application does not exist", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "has-prev-application": "false",
      "prev-laa-reference-input": "",
    };

    clientDetailsAdaptor.processHasPrevApplicationForm(
      requestStub,
      responseStub,
    );

    assert.equal(requestStub.session.clientHasPrevApplication, false);
    assert.equal(requestStub.session.prevLaaReferenceInput, null);
  });

  it("process has prev application form sets boolean value and reference in session when previous application does exist", () => {
    const formValidator = new FormValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "has-prev-application": "true",
      "prev-laa-reference-input": "123456789",
    };

    clientDetailsAdaptor.processHasPrevApplicationForm(
      requestStub,
      responseStub,
    );

    assert.equal(requestStub.session.clientHasPrevApplication, true);
    assert.equal(requestStub.session.prevLaaReferenceInput, "123456789");
  });
});
