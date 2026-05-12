import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import { type Request, type Response, type Locals, response } from "express";
import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { DeceasedDetailsAdaptor } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.js";

describe("Deceased details adaptor", () => {
  const formValidator = new DeceasedDetailsValidator();
  const deceasedDetailsAdaptor = new DeceasedDetailsAdaptor(formValidator);

  let responseStub = stubInterface<Response>();
  let requestStub = stubInterface<Request>();

  beforeEach(() => {
    responseStub = stubInterface<Response>();
    requestStub = stubInterface<Request>();
  });

  it("renderNameForm renders view", () => {
    deceasedDetailsAdaptor.renderNameForm(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/deceased-details/name");
  });

  describe("processNameForm", () => {
    it("redirects to date of death on valid input", () => {
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

    it("re-renders name on bad input with errors", () => {
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

    it("adds name data to the session", () => {
      const firstName = "Test first";
      const lastName = "Test last";
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-first-name": firstName,
        "deceased-last-name": lastName,
      };

      deceasedDetailsAdaptor.processNameForm(requestStub, responseStub);

      assert.equal(requestStub.session.deceasedFirstName, firstName);
      assert.equal(requestStub.session.deceasedLastName, lastName);
    });
  });

  describe("renderDateOfDeathForm", () => {
    it("initiates render of view", () => {
      deceasedDetailsAdaptor.renderDateOfDeathForm(requestStub, responseStub);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/deceased-details/date-of-death");
    });

    it("passes csrf token on render view initiation", () => {
      deceasedDetailsAdaptor.renderDateOfDeathForm(requestStub, responseStub);
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Object;
      assert.ok(argsObject.hasOwnProperty("csrfToken"));
    });
  });

  describe("processsDateOfDeathForm", () => {
    it("redirects to date of birth given valid input", () => {
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "1",
        "deceased-date-of-death-month": "1",
        "deceased-date-of-death-year": "1990",
      };

      deceasedDetailsAdaptor.processDateOfDeathForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const redirect = responseStub.redirect.getCall(0).args;
      assert.equal(redirect[0], "/apply/deceased-details/dob");
    });

    it("initiates re-render with errorSummaries, csrfToken and deceasedDetails given invalid input", () => {
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "",
        "deceased-date-of-death-month": "",
        "deceased-date-of-death-year": "",
      };

      deceasedDetailsAdaptor.processDateOfDeathForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/deceased-details/date-of-death");

      const errorObject = renderArgs[1] as Object;
      assert.ok(errorObject.hasOwnProperty("errorSummaries"));
      assert.ok(errorObject.hasOwnProperty("csrfToken"));
      assert.ok(errorObject.hasOwnProperty("deceasedDetails"));
    });

    it("adds data to the session", () => {
      const dateOfDeathDay = "1";
      const dateOfDeathMonth = "2";
      const dateOfDeathYear = "1990";

      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": dateOfDeathDay,
        "deceased-date-of-death-month": dateOfDeathMonth,
        "deceased-date-of-death-year": dateOfDeathYear,
      };

      deceasedDetailsAdaptor.processDateOfDeathForm(requestStub, responseStub);

      assert.equal(requestStub.session.deceasedDateOfDeathDay, dateOfDeathDay);
      assert.equal(
        requestStub.session.deceasedDateOfDeathMonth,
        dateOfDeathMonth,
      );
      assert.equal(
        requestStub.session.deceasedDateOfDeathYear,
        dateOfDeathYear,
      );
    });
  });

  describe("renderDateOfBirthForm", () => {
    it("initiates render of view", () => {
      deceasedDetailsAdaptor.renderDateOfBirthForm(requestStub, responseStub);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/deceased-details/dob");
    });

    it("passes csrf token on render view initiation", () => {
      deceasedDetailsAdaptor.renderDateOfBirthForm(requestStub, responseStub);
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Object;
      assert.ok(argsObject.hasOwnProperty("csrfToken"));
    });

    it("passes session input data to render view initiation", () => {
      const [day, month, year] = ["1", "1", "1990"];

      requestStub.session.deceasedDateOfBirthDay = day;
      requestStub.session.deceasedDateOfBirthMonth = month;
      requestStub.session.deceasedDateOfBirthYear = year;

      deceasedDetailsAdaptor.renderDateOfBirthForm(requestStub, responseStub);
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Record<string, any>;

      const {
        deceasedDetails: { dateOfBirthDay, dateOfBirthMonth, dateOfBirthYear },
      } = argsObject;

      assert.equal(dateOfBirthDay, day);
      assert.equal(dateOfBirthMonth, month);
      assert.equal(dateOfBirthYear, year);
    });
  });

  describe("processDateOfBirthForm", () => {
    it("redirects to client relationship given valid input", () => {
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-date-of-birth-day": "1",
        "deceased-date-of-birth-month": "1",
        "deceased-date-of-birth-year": "1990",
      };

      deceasedDetailsAdaptor.processDateOfBirthForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const redirect = responseStub.redirect.getCall(0).args;
      assert.equal(redirect[0], "/apply/deceased-details/client-relationship");
    });
    it("adds data to the session", () => {
      const dateOfBirthDay = "1";
      const dateOfBirthMonth = "2";
      const dateOfBirthYear = "1990";

      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-date-of-birth-day": dateOfBirthDay,
        "deceased-date-of-birth-month": dateOfBirthMonth,
        "deceased-date-of-birth-year": dateOfBirthYear,
      };

      deceasedDetailsAdaptor.processDateOfBirthForm(requestStub, responseStub);

      assert.equal(requestStub.session.deceasedDateOfBirthDay, dateOfBirthDay);
      assert.equal(
        requestStub.session.deceasedDateOfBirthMonth,
        dateOfBirthMonth,
      );
      assert.equal(
        requestStub.session.deceasedDateOfBirthYear,
        dateOfBirthYear,
      );
    });
  });

  describe("renderClientRelationshipForm", () => {
    it("initiates render of view", () => {
      deceasedDetailsAdaptor.renderClientRelationshipForm(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/deceased-details/client-relationship");
    });

    it("passes csrf token on render view initiation", () => {
      deceasedDetailsAdaptor.renderClientRelationshipForm(
        requestStub,
        responseStub,
      );
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Object;
      assert.ok(argsObject.hasOwnProperty("csrfToken"));
    });

    it("passes session input data to render view initiation", () => {
      const expectedHasClientRelationship = "true";
      const expectedClientRelationship = "Test";

      requestStub.session.deceasedHasClientRelationship =
        expectedHasClientRelationship;
      requestStub.session.deceasedClientRelationship =
        expectedClientRelationship;

      deceasedDetailsAdaptor.renderClientRelationshipForm(
        requestStub,
        responseStub,
      );
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Record<string, any>;

      const {
        deceasedDetails: { clientRelationship, hasClientRelationship },
      } = argsObject;

      assert.equal(hasClientRelationship, expectedHasClientRelationship);
      assert.equal(clientRelationship, expectedClientRelationship);
    });
  });

  describe("processClientRelationshipForm", () => {
    it("redirects to coroners reference given valid input", () => {
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-client-relationship": "Father",
      };

      deceasedDetailsAdaptor.processClientRelationshipForm(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.redirect.callCount, 1);
      const redirect = responseStub.redirect.getCall(0).args;
      assert.equal(redirect[0], "/apply/deceased-details/coroner-reference");
    });

    it("adds data to the session", () => {
      const expectedHasClientRelationship = "true";
      const expectedClientRelationship = "Test";

      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-has-client-relationship": expectedHasClientRelationship,
        "deceased-client-relationship": expectedClientRelationship,
      };

      deceasedDetailsAdaptor.processClientRelationshipForm(
        requestStub,
        responseStub,
      );

      assert.equal(
        requestStub.session.deceasedHasClientRelationship,
        expectedHasClientRelationship,
      );
      assert.equal(
        requestStub.session.deceasedClientRelationship,
        expectedClientRelationship,
      );
    });
  });

  describe("renderCoronerReferenceForm", () => {
    it("initiates render of view", () => {
      deceasedDetailsAdaptor.renderCoronerReferenceForm(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/deceased-details/coroner-reference");
    });
    it("passes csrf token on render view initiation", () => {
      deceasedDetailsAdaptor.renderCoronerReferenceForm(
        requestStub,
        responseStub,
      );
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Object;
      assert.ok(argsObject.hasOwnProperty("csrfToken"));
    });
    it("passes session input data to render view initiation", () => {
      const expectedCoronerReference = "Test";

      requestStub.session.deceasedCoronerReference = expectedCoronerReference;

      deceasedDetailsAdaptor.renderCoronerReferenceForm(
        requestStub,
        responseStub,
      );

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as Record<string, any>;

      const {
        deceasedDetails: { coronerReference },
      } = argsObject;

      assert.equal(coronerReference, expectedCoronerReference);
    });
  });

  describe("processCoronerReferenceForm", () => {
    it("redirects to further information given valid input", () => {
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-coroner-reference": "Test",
      };

      deceasedDetailsAdaptor.processCoronerReferenceForm(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.redirect.callCount, 1);
      const redirect = responseStub.redirect.getCall(0).args;
      assert.equal(redirect[0], "/apply/deceased-details/further-information");
    });
    it("adds data to the session", () => {
      const expectedCoronerReference = "test";

      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-coroner-reference": expectedCoronerReference,
      };

      deceasedDetailsAdaptor.processCoronerReferenceForm(
        requestStub,
        responseStub,
      );

      assert.equal(
        requestStub.session.deceasedCoronerReference,
        expectedCoronerReference,
      );
    });
  });

  describe("renderFurtherInfomationForm", () => {
    it("initiates render of view", () => {
      deceasedDetailsAdaptor.renderFurtherInfomationForm(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/deceased-details/further-information");
    });
    it("passes csrf token on render view initiation", () => {
      deceasedDetailsAdaptor.renderFurtherInfomationForm(
        requestStub,
        responseStub,
      );
      const renderArgs = responseStub.render.getCall(0).args;

      const argsObject = renderArgs[1] as Object;
      assert.ok(argsObject.hasOwnProperty("csrfToken"));
    });
    it("passes session input data to render view initiation", () => {
      const expectedhasFurtherInformation = "true";
      const expectedFurtherInformation = "Test";

      requestStub.session.deceasedHasFurtherInformation =
        expectedhasFurtherInformation;
      requestStub.session.deceasedFurtherInformation =
        expectedFurtherInformation;

      deceasedDetailsAdaptor.renderFurtherInfomationForm(
        requestStub,
        responseStub,
      );

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as Record<string, any>;

      const {
        deceasedDetails: { hasFurtherInformation, furtherInformation },
      } = argsObject;

      assert.equal(hasFurtherInformation, expectedhasFurtherInformation);
      assert.equal(furtherInformation, expectedFurtherInformation);
    });
  });

  describe("processFurtherInfomationForm", () => {
    it("redirects to interested parties given valid input", () => {
      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-coroner-reference": "Test",
      };

      deceasedDetailsAdaptor.processFurtherInfomationForm(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.redirect.callCount, 1);
      const redirect = responseStub.redirect.getCall(0).args;
      assert.equal(redirect[0], "/apply/interested-parties");
    });
    it("adds data to the session", () => {
      const expectedHasFurtherInformation = "true";
      const expectedFurtherInformation = "Test";

      requestStub.body = {
        _csrf: "abcdefg",
        "deceased-has-further-information": expectedHasFurtherInformation,
        "deceased-further-information": expectedFurtherInformation,
      };

      deceasedDetailsAdaptor.processFurtherInfomationForm(
        requestStub,
        responseStub,
      );

      assert.equal(
        requestStub.session.deceasedHasFurtherInformation,
        expectedHasFurtherInformation,
      );
      assert.equal(
        requestStub.session.deceasedFurtherInformation,
        expectedFurtherInformation,
      );
    });
  });
});
