import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";
import { ClientDetailsValidator } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.validator.js";
import { Address } from "#src/domain/Client/Address.js";
import {CorrespondenceRecipient} from "#src/domain/Client/CorrespondenceRecipient.js";

describe("Client details adaptor", () => {
  it("render name and dob form", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.renderNameForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/client-details/name-and-dob");
  });

  it("process name and dob form redirects to nino", () => {
    const formValidator = new ClientDetailsValidator();
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
    const formValidator = new ClientDetailsValidator();
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
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.renderNinoForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/client-details/nino");
  });

  it("process nino form redirects to has prev application", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = { "has-nino": "true", "nino-input": "PC345678A" };

    clientDetailsAdaptor.processNinoForm(requestStub, responseStub);
    assert.equal(responseStub.redirect.callCount, 1);
    const renderArgs = responseStub.redirect.getCall(0).args;
    assert.equal(renderArgs[0], "/apply/client-details/has-prev-application");
  });

  it("render home address form", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    clientDetailsAdaptor.renderHomeAddressForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/client-details/home-address");
  });

  it("process home address form redirects to correspondence address source", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "home-address-line-1": "4 Privet Drive",
      "home-address-line-2": "Little Whinging",
      "home-town-or-city": "Little Whinging",
      "home-county": "Surrey",
      "home-postcode": "SW1A 1AA",
    };

    clientDetailsAdaptor.processHomeAddressForm(requestStub, responseStub);
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(
      redirectArgs[0],
      "/apply/client-details/correspondence-address-source",
    );
  });

  it("process home address form stores a structured object in session", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "home-address-line-1": "4 Privet Drive",
      "home-address-line-2": "",
      "home-town-or-city": "Little Whinging",
      "home-county": "",
      "home-postcode": "SW1A 1AA",
    };

    clientDetailsAdaptor.processHomeAddressForm(requestStub, responseStub);

    assert.deepEqual(
      requestStub.session.clientHomeAddress,
      new Address({
        addressLine1: "4 Privet Drive",
        addressLine2: null,
        townOrCity: "Little Whinging",
        county: null,
        postcode: "SW1A 1AA",
      }),
    );
    assert.equal(requestStub.session.clientHasNoFixedAbode, false);
  });

  it("process home address form uppercases postcode before storing it in session", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "home-address-line-1": "4 Privet Drive",
      "home-address-line-2": "",
      "home-town-or-city": "Little Whinging",
      "home-county": "",
      "home-postcode": "sw1a 1aa",
    };

    clientDetailsAdaptor.processHomeAddressForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientHomeAddress?.postcode, "SW1A 1AA");
  });

  it("process home address form sets no fixed abode and does not store home address", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.session.clientHomeAddress = {
      addressLine1: "Existing address",
      addressLine2: null,
      townOrCity: "Existing town",
      county: null,
      postcode: "SW1A 1AA",
    };

    requestStub.body = {
      "has-no-fixed-abode": "true",
      "home-address-line-1": "",
      "home-address-line-2": "",
      "home-town-or-city": "",
      "home-county": "",
      "home-postcode": "",
    };

    clientDetailsAdaptor.processHomeAddressForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientHasNoFixedAbode, true);
    assert.equal(requestStub.session.clientHomeAddress, undefined);
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(
      redirectArgs[0],
      "/apply/client-details/correspondence-address-source",
    );
  });

  it("process correspondence source redirects to correspondence address form when specified address is selected", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "correspondence-address-source": "USE_SPECIFIED_ADDRESS",
    };

    clientDetailsAdaptor.processCorrespondenceAddressSourceForm(
      requestStub,
      responseStub,
    );

    assert.equal(
      requestStub.session.clientCorrespondenceAddressSource,
      "USE_SPECIFIED_ADDRESS",
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(
      redirectArgs[0],
      "/apply/client-details/correspondence-address",
    );
  });

  it("process correspondence source redirects to correspondence recipient when provider address is selected", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "correspondence-address-source": "USE_PROVIDER_ADDRESS",
    };

    clientDetailsAdaptor.processCorrespondenceAddressSourceForm(
      requestStub,
      responseStub,
    );

    assert.equal(
      requestStub.session.clientCorrespondenceAddressSource,
      "USE_PROVIDER_ADDRESS",
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(
      redirectArgs[0],
      "/apply/client-details/correspondence-recipient",
    );
  });

  it("process correspondence address form stores structured correspondence address and redirects", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "correspondence-address-line-1": "1 Acacia Avenue",
      "correspondence-address-line-2": "Flat 2",
      "correspondence-town-or-city": "London",
      "correspondence-county": "Greater London",
      "correspondence-postcode": "sw1a 1aa",
    };

    clientDetailsAdaptor.processCorrespondenceAddressForm(
      requestStub,
      responseStub,
    );

    assert.deepEqual(
      requestStub.session.clientCorrespondenceAddress,
      new Address({
        addressLine1: "1 Acacia Avenue",
        addressLine2: "Flat 2",
        townOrCity: "London",
        county: "Greater London",
        postcode: "SW1A 1AA",
      }),
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(
      redirectArgs[0],
      "/apply/client-details/correspondence-recipient",
    );
  });

  it("process correspondence recipient form stores person recipient and redirects", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "correspondence-recipient": "PERSON",
      "correspondence-recipient-person-name": "Jane Doe",
      "correspondence-recipient-organisation-name": "",
    };

    clientDetailsAdaptor.processCorrespondenceRecipientForm(
      requestStub,
      responseStub,
    );

    assert.deepEqual(requestStub.session.clientCorrespondenceRecipient, new CorrespondenceRecipient("PERSON",
      "Jane Doe"
    ));
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(redirectArgs[0], "/apply/proceedings");
  });

  it("process correspondence recipient form clears recipient when no is selected", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.session.clientCorrespondenceRecipient = {
      recipientType: "PERSON",
      recipientName: "Existing Recipient",
    };
    requestStub.body = {
      "correspondence-recipient": "NONE",
      "correspondence-recipient-person-name": "",
      "correspondence-recipient-organisation-name": "",
    };

    clientDetailsAdaptor.processCorrespondenceRecipientForm(
      requestStub,
      responseStub,
    );

    assert.equal(requestStub.session.clientCorrespondenceRecipient, null);
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(redirectArgs[0], "/apply/proceedings");
  });

  it("process nino form adds nino to session when nino exists", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = { "has-nino": "true", "nino-input": "123456789" };

    clientDetailsAdaptor.processNinoForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientNino, "123456789");
  });

  it("process nino form set nino to null in session when nino does not exist", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);
    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = { "has-nino": "false", "nino-input": "" };

    clientDetailsAdaptor.processNinoForm(requestStub, responseStub);

    assert.equal(requestStub.session.clientNino, null);
  });

  it("render has prev application form", () => {
    const formValidator = new ClientDetailsValidator();
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
  it("process correspondence recipient form redirects to proceedings if no selectedProceedings exist in session", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "prev-laa-reference-input": "",
      "correspondence-recipient": "NONE",
      "correspondence-recipient-person-name": "",
      "correspondence-recipient-organisation-name": "",
    };

    clientDetailsAdaptor.processCorrespondenceRecipientForm(
      requestStub,
      responseStub,
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(redirectArgs[0], "/apply/proceedings");
  });
  it("process correspondence recipient form redirects to confirm proceedings form if a proceeding has been previously selected", () => {
    const formValidator = new ClientDetailsValidator();
    const clientDetailsAdaptor = new ClientDetailsAdaptor(formValidator);

    const responseStub = stubInterface<Response>();
    const requestStub = stubInterface<Request>();

    requestStub.body = {
      "prev-laa-reference-input": "",
      "correspondence-recipient": "NONE",
      "correspondence-recipient-person-name": "",
      "correspondence-recipient-organisation-name": "",
    };
    requestStub.session.selectedProceedings = [
      {
        proceedingId: "MN035",
        proceedingDescription: "Clinical Negligence",
        matterType: "INQUEST",
      },
    ];

    clientDetailsAdaptor.processCorrespondenceRecipientForm(
      requestStub,
      responseStub,
    );
    assert.equal(responseStub.redirect.callCount, 1);
    const redirectArgs = responseStub.redirect.getCall(0).args;
    assert.equal(redirectArgs[0], "/apply/proceedings/confirmation");
  });

  it("process has prev application form sets boolean value to false in session when previous application does not exist", () => {
    const formValidator = new ClientDetailsValidator();
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

    assert.equal(requestStub.session.clientHasPrevApplication, "false");
    assert.equal(requestStub.session.prevLaaReferenceInput, null);
  });

  it("process has prev application form sets boolean value and reference in session when previous application does exist", () => {
    const formValidator = new ClientDetailsValidator();
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

    assert.equal(requestStub.session.clientHasPrevApplication, "true");
    assert.equal(requestStub.session.prevLaaReferenceInput, "123456789");
  });
});
