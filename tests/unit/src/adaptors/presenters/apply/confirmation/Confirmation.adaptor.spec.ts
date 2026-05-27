import { strict as assert } from "assert";
import { stubInterface, StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { ConfirmationAdaptor } from "#src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.js";
import { Formatter } from "#src/utils/Formatter.js";
import type { ApplySubmitPort } from "#src/ports/source/inquests-api/SubmitApplication.port.js";
import { SubmitApplicationRequest } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/models/SubmitApplication.types.js";
import { SessionHelper } from "#src/infrastructure/express/session/sessionHelpers.js";

describe("Confirmation adaptor", () => {
  let confirmationFormatter: Formatter;
  let sessionHelper: StubbedInstance<SessionHelper>;
  let applySubmitPortStub: StubbedInstance<ApplySubmitPort>;

  let confirmationAdaptor: ConfirmationAdaptor;
  let responseStub: StubbedInstance<Response>;
  let requestStub: StubbedInstance<Request>;

  beforeEach(() => {
    responseStub = stubInterface<Response>();
    requestStub = stubInterface<Request>();
    applySubmitPortStub = stubInterface<ApplySubmitPort>();
    confirmationFormatter = new Formatter();
    sessionHelper = stubInterface<SessionHelper>();
    confirmationAdaptor = new ConfirmationAdaptor(
      confirmationFormatter,
      applySubmitPortStub,
      sessionHelper,
    );
    responseStub.locals = {
      csrfToken: "abcdefg",
    };
  });

  it("render check your answers page", () => {
    confirmationAdaptor.renderCheckYourAnswers(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/check-your-answers");
  });

  it("render check your answers page", () => {
    requestStub.session.clientFirstName = "test name";
    requestStub.session.clientLastName = "last name";
    requestStub.session.clientDobDay = "1";
    requestStub.session.clientDobMonth = "12";
    requestStub.session.clientDobYear = "1990";
    requestStub.session.clientHasNoFixedAbode = false;
    requestStub.session.clientHomeAddress = {
      addressLine1: "4 Privet Drive",
      addressLine2: "Little Whinging",
      townOrCity: "Little Whinging",
      county: "Surrey",
      postcode: "B1 123b",
    };
    requestStub.session.clientCorrespondenceAddressSource =
      "USE_CLIENT_HOME_ADDRESS";

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
        key: { text: "Test public authority" },
        actions: {
          items: [
            {
              href: "/apply/public-authority/remove?publicAuthorityId=12345",
              text: "Remove",
            },
          ],
        },
      },
    ];

    requestStub.session.selectedPublicAuthorities = publicAuthorities;

    confirmationAdaptor.renderCheckYourAnswers(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.deepEqual(renderArgs[1], {
      csrfToken: "abcdefg",
      client: {
        clientFirstName: "test name",
        clientLastName: "last name",
        clientDob: "1/12/1990",
        clientAddress:
          "4 Privet DriveLittle Whinging Little Whinging Surrey B1 123b",
        clientCorrespondenceAddress: "Same as client's home address",
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
    confirmationAdaptor.renderConfirmSuccess(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/confirm-success");
    assert.deepEqual(renderArgs[1], {
      csrfToken: "abcdefg",
      applicationReferenceNumber: "",
    });
  });

  it("render confirm success page with application reference number", () => {
    requestStub.session.applicationReferenceNumber = "L-ABC-123";

    confirmationAdaptor.renderConfirmSuccess(requestStub, responseStub);
    assert.equal(responseStub.render.callCount, 1);
    const renderArgs = responseStub.render.getCall(0).args;
    assert.equal(renderArgs[0], "apply/confirm-success");
    assert.deepEqual(renderArgs[1], {
      csrfToken: "abcdefg",
      applicationReferenceNumber: "L-ABC-123",
    });
  });

  it("clears session data after rendering confirm success page", () => {
    requestStub.session.applicationReferenceNumber = "L-ABC-123";
    confirmationAdaptor.renderConfirmSuccess(requestStub, responseStub);
    assert.equal(sessionHelper.clearApplyFormData.callCount, 1);
  });

  describe("renderClientDeclarationForm", () => {
    it("initiates render of view", () => {
      confirmationAdaptor.renderClientDeclarationForm(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/submit/client-declaration");
    });

    it("passes csrf token on render view initiation", () => {
      confirmationAdaptor.renderClientDeclarationForm(
        requestStub,
        responseStub,
      );

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(argsObject.csrfToken, "abcdefg");
    });

    it("passes session input data to render view initiation", () => {
      requestStub.session.clientFirstName = "Test";
      requestStub.session.clientLastName = "User";

      confirmationAdaptor.renderClientDeclarationForm(
        requestStub,
        responseStub,
      );

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as unknown as Record<string, any>;

      assert.equal(argsObject.clientDetails.firstName, "Test");
      assert.equal(argsObject.clientDetails.lastName, "User");
    });
  });

  describe("processClientDeclarationForm", () => {
    it("submits application, saves applicationReferenceNumber and redirects on 201", async () => {
      requestStub.session.clientFirstName = "Client";
      requestStub.session.clientLastName = "One";
      requestStub.session.clientLastNameAtBirth = "Birthname";
      requestStub.session.clientDobDay = "05";
      requestStub.session.clientDobMonth = "10";
      requestStub.session.clientDobYear = "1989";
      requestStub.session.clientNino = "AB123456C";
      requestStub.session.deceasedClientRelationship = "Spouse";

      requestStub.session.deceasedFirstName = "Deceased";
      requestStub.session.deceasedLastName = "Two";
      requestStub.session.deceasedDateOfBirthDay = "01";
      requestStub.session.deceasedDateOfBirthMonth = "02";
      requestStub.session.deceasedDateOfBirthYear = "1975";
      requestStub.session.deceasedDateOfDeathDay = "10";
      requestStub.session.deceasedDateOfDeathMonth = "03";
      requestStub.session.deceasedDateOfDeathYear = "2024";
      requestStub.session.deceasedCoronerReference = "COR-123";
      requestStub.session.deceasedFurtherInformation = "Further info";

      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      applySubmitPortStub.submitApplication.resolves({
        statusCode: 201,
        laaReference: 123,
      });

      await confirmationAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      assert.equal(applySubmitPortStub.submitApplication.callCount, 1);

      const submitBody = applySubmitPortStub.submitApplication.getCall(0)
        .args[0] as SubmitApplicationRequest;

      assert.equal(submitBody.client.clientFirstName, "Client");
      assert.equal(submitBody.client.clientLastName, "One");
      assert.equal(submitBody.client.clientLastNameAtBirth, "Birthname");
      assert.equal(submitBody.client.dateOfBirth, "05-10-1989");
      assert.equal(submitBody.client.nationalInsuranceNumber, "AB123456C");
      assert.equal(submitBody.client.hasNoFixedAbode, false);
      assert.equal(
        submitBody.client.correspondenceAddressSource,
        "USE_PROVIDER_ADDRESS",
      );

      assert.equal(submitBody.deceased.deceasedFirstName, "Deceased");
      assert.equal(submitBody.deceased.deceasedLastName, "Two");
      assert.equal(submitBody.deceased.deceasedDateOfBirth, "01-02-1975");
      assert.equal(submitBody.deceased.deceasedDateOfDeath, "10-03-2024");
      assert.equal(submitBody.deceased.coronersReference, "COR-123");
      assert.equal(submitBody.deceased.furtherInformation, "Further info");
      assert.equal(submitBody.deceased.clientRelationshipToDeceased, "Spouse");

      assert.deepEqual(submitBody.proceedings, [
        {
          proceedingId: "MN035",
        },
      ]);
      assert.deepEqual(submitBody.publicBodies, [
        {
          publicBodyId: "Home Office",
        },
      ]);

      assert.equal(requestStub.session.applicationReferenceNumber, "123");

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(redirectArgs[0], "/apply/confirmation/success");
    });

    it("omits optional nullable client fields when not in session", async () => {
      requestStub.session.clientFirstName = "Client";
      requestStub.session.clientLastName = "One";
      requestStub.session.clientDobDay = "05";
      requestStub.session.clientDobMonth = "10";
      requestStub.session.clientDobYear = "1989";
      requestStub.session.deceasedClientRelationship = "Spouse";

      requestStub.session.deceasedFirstName = "Deceased";
      requestStub.session.deceasedLastName = "Two";
      requestStub.session.deceasedDateOfBirthDay = "01";
      requestStub.session.deceasedDateOfBirthMonth = "02";
      requestStub.session.deceasedDateOfBirthYear = "1975";
      requestStub.session.deceasedDateOfDeathDay = "10";
      requestStub.session.deceasedDateOfDeathMonth = "03";
      requestStub.session.deceasedDateOfDeathYear = "2024";
      requestStub.session.deceasedCoronerReference = "COR-123";
      requestStub.session.deceasedFurtherInformation = "Further info";

      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      applySubmitPortStub.submitApplication.resolves({
        statusCode: 201,
        laaReference: 123,
      });

      await confirmationAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      const submitBody = applySubmitPortStub.submitApplication.getCall(0)
        .args[0] as SubmitApplicationRequest;

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          submitBody.client,
          "clientLastNameAtBirth",
        ),
        false,
      );
      assert.equal(
        Object.prototype.hasOwnProperty.call(
          submitBody.client,
          "nationalInsuranceNumber",
        ),
        false,
      );
      assert.equal(submitBody.client.hasNoFixedAbode, false);
      assert.equal(
        submitBody.client.correspondenceAddressSource,
        "USE_PROVIDER_ADDRESS",
      );
    });

    it("sets hasNoFixedAbode true and omits homeAddress when selected", async () => {
      requestStub.session.clientFirstName = "Client";
      requestStub.session.clientLastName = "One";
      requestStub.session.clientDobDay = "05";
      requestStub.session.clientDobMonth = "10";
      requestStub.session.clientDobYear = "1989";
      requestStub.session.clientHasNoFixedAbode = true;
      requestStub.session.clientHomeAddress = {
        addressLine1: "4 Privet Drive",
        addressLine2: null,
        townOrCity: "Little Whinging",
        county: null,
        postcode: "SW1A 1AA",
      };
      requestStub.session.deceasedClientRelationship = "Spouse";

      requestStub.session.deceasedFirstName = "Deceased";
      requestStub.session.deceasedLastName = "Two";
      requestStub.session.deceasedDateOfBirthDay = "01";
      requestStub.session.deceasedDateOfBirthMonth = "02";
      requestStub.session.deceasedDateOfBirthYear = "1975";
      requestStub.session.deceasedDateOfDeathDay = "10";
      requestStub.session.deceasedDateOfDeathMonth = "03";
      requestStub.session.deceasedDateOfDeathYear = "2024";
      requestStub.session.deceasedCoronerReference = "COR-123";
      requestStub.session.deceasedFurtherInformation = "Further info";

      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      applySubmitPortStub.submitApplication.resolves({
        statusCode: 201,
        laaReference: 123,
      });

      await confirmationAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      const submitBody = applySubmitPortStub.submitApplication.getCall(0)
        .args[0] as SubmitApplicationRequest;

      assert.equal(submitBody.client.hasNoFixedAbode, true);
      assert.equal(
        submitBody.client.correspondenceAddressSource,
        "USE_PROVIDER_ADDRESS",
      );
      assert.equal(submitBody.client.homeAddress, null);
    });

    it("includes specified correspondence address when source is USE_SPECIFIED_ADDRESS", async () => {
      requestStub.session.clientFirstName = "Client";
      requestStub.session.clientLastName = "One";
      requestStub.session.clientDobDay = "05";
      requestStub.session.clientDobMonth = "10";
      requestStub.session.clientDobYear = "1989";
      requestStub.session.clientCorrespondenceAddressSource =
        "USE_SPECIFIED_ADDRESS";
      requestStub.session.clientCorrespondenceAddress = {
        addressLine1: "1 Acacia Avenue",
        addressLine2: "Flat 2",
        townOrCity: "London",
        county: "Greater London",
        postcode: "SW1A 1AA",
      };
      requestStub.session.deceasedClientRelationship = "Spouse";

      requestStub.session.deceasedFirstName = "Deceased";
      requestStub.session.deceasedLastName = "Two";
      requestStub.session.deceasedDateOfBirthDay = "01";
      requestStub.session.deceasedDateOfBirthMonth = "02";
      requestStub.session.deceasedDateOfBirthYear = "1975";
      requestStub.session.deceasedDateOfDeathDay = "10";
      requestStub.session.deceasedDateOfDeathMonth = "03";
      requestStub.session.deceasedDateOfDeathYear = "2024";
      requestStub.session.deceasedCoronerReference = "COR-123";
      requestStub.session.deceasedFurtherInformation = "Further info";

      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      applySubmitPortStub.submitApplication.resolves({
        statusCode: 201,
        laaReference: 123,
      });

      await confirmationAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      const submitBody = applySubmitPortStub.submitApplication.getCall(0)
        .args[0] as SubmitApplicationRequest;

      assert.equal(
        submitBody.client.correspondenceAddressSource,
        "USE_SPECIFIED_ADDRESS",
      );
      assert.deepEqual(submitBody.client.correspondenceAddress, {
        addressLine1: "1 Acacia Avenue",
        addressLine2: "Flat 2",
        townOrCity: "London",
        county: "Greater London",
        postcode: "SW1A 1AA",
      });
    });

    it("omits optional nullable client fields when null in session", async () => {
      requestStub.session.clientFirstName = "Client";
      requestStub.session.clientLastName = "One";
      requestStub.session.clientLastNameAtBirth = null as unknown as string;
      requestStub.session.clientDobDay = "05";
      requestStub.session.clientDobMonth = "10";
      requestStub.session.clientDobYear = "1989";
      requestStub.session.clientNino = null as unknown as string;
      requestStub.session.deceasedClientRelationship = "Spouse";

      requestStub.session.deceasedFirstName = "Deceased";
      requestStub.session.deceasedLastName = "Two";
      requestStub.session.deceasedDateOfBirthDay = "01";
      requestStub.session.deceasedDateOfBirthMonth = "02";
      requestStub.session.deceasedDateOfBirthYear = "1975";
      requestStub.session.deceasedDateOfDeathDay = "10";
      requestStub.session.deceasedDateOfDeathMonth = "03";
      requestStub.session.deceasedDateOfDeathYear = "2024";
      requestStub.session.deceasedCoronerReference = "COR-123";
      requestStub.session.deceasedFurtherInformation = "Further info";

      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      applySubmitPortStub.submitApplication.resolves({
        statusCode: 201,
        laaReference: 123,
      });

      await confirmationAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      const submitBody = applySubmitPortStub.submitApplication.getCall(0)
        .args[0] as SubmitApplicationRequest;

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          submitBody.client,
          "clientLastNameAtBirth",
        ),
        false,
      );
      assert.equal(
        Object.prototype.hasOwnProperty.call(
          submitBody.client,
          "nationalInsuranceNumber",
        ),
        false,
      );
    });

    it("calls clearApplyFormData on successful submission and sets applicationReferenceNumber in session after", async () => {
      requestStub.session.clientFirstName = "Client";
      requestStub.session.clientLastName = "One";
      requestStub.session.clientLastNameAtBirth = "Birthname";
      requestStub.session.clientDobDay = "05";
      requestStub.session.clientDobMonth = "10";
      requestStub.session.clientDobYear = "1989";
      requestStub.session.clientNino = "AB123456C";
      requestStub.session.deceasedClientRelationship = "Spouse";

      requestStub.session.deceasedFirstName = "Deceased";
      requestStub.session.deceasedLastName = "Two";
      requestStub.session.deceasedDateOfBirthDay = "01";
      requestStub.session.deceasedDateOfBirthMonth = "02";
      requestStub.session.deceasedDateOfBirthYear = "1975";
      requestStub.session.deceasedDateOfDeathDay = "10";
      requestStub.session.deceasedDateOfDeathMonth = "03";
      requestStub.session.deceasedDateOfDeathYear = "2024";
      requestStub.session.deceasedCoronerReference = "COR-123";
      requestStub.session.deceasedFurtherInformation = "Further info";

      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      applySubmitPortStub.submitApplication.resolves({
        statusCode: 201,
        laaReference: 123,
      });

      await confirmationAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      assert.equal(sessionHelper.clearApplyFormData.callCount, 1);
      assert.equal(requestStub.session.applicationReferenceNumber, "123");
    });
  });
});
