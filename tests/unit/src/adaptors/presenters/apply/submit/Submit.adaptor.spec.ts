import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { SubmitAdaptor } from "#src/adaptors/presenters/apply/Submit/Submit.adaptor.js";
import type {
  ApplySubmitPort,
  SubmitApplicationRequest,
} from "#src/ports/source/inquests-api/SubmitApplication.port.js";

describe("Submit adaptor", () => {
  let submitAdaptor = new SubmitAdaptor(stubInterface<ApplySubmitPort>());
  let applySubmitPortStub = stubInterface<ApplySubmitPort>();

  let responseStub = stubInterface<Response>();
  let requestStub = stubInterface<Request>();

  beforeEach(() => {
    applySubmitPortStub = stubInterface<ApplySubmitPort>();
    submitAdaptor = new SubmitAdaptor(applySubmitPortStub);
    responseStub = stubInterface<Response>();
    requestStub = stubInterface<Request>();
    responseStub.locals = {
      csrfToken: "abcdefg",
    };
  });

  describe("renderClientDeclarationForm", () => {
    it("initiates render of view", () => {
      submitAdaptor.renderClientDeclarationForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/submit/client-declaration");
    });

    it("passes csrf token on render view initiation", () => {
      submitAdaptor.renderClientDeclarationForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const argsObject = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(argsObject.csrfToken, "abcdefg");
    });

    it("passes session input data to render view initiation", () => {
      requestStub.session.clientFirstName = "Test";
      requestStub.session.clientLastName = "User";

      submitAdaptor.renderClientDeclarationForm(requestStub, responseStub);

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
        applicationReferenceNumber: "APP-123",
      });

      await submitAdaptor.processClientDeclarationForm(
        requestStub,
        responseStub,
      );

      assert.equal(applySubmitPortStub.submitApplication.callCount, 1);

      const submitBody = applySubmitPortStub.submitApplication.getCall(0)
        .args[0] as SubmitApplicationRequest;

      assert.equal(submitBody.client.clientFirstName, "Client");
      assert.equal(submitBody.client.clientLastName, "One");
      assert.equal(submitBody.client.clientLastNameAtBirth, "Birthname");
      assert.equal(submitBody.client.clientDob, "1989-10-05");
      assert.equal(submitBody.client.clientNino, "AB123456C");
      assert.equal(submitBody.client.relationshipToDeceased, "Spouse");

      assert.equal(submitBody.deceased.deceasedFirstName, "Deceased");
      assert.equal(submitBody.deceased.deceasedLastName, "Two");
      assert.equal(submitBody.deceased.deceasedDob, "1975-02-01");
      assert.equal(submitBody.deceased.deceasedDateOfDeath, "2024-03-10");
      assert.equal(submitBody.deceased.coronersReference, "COR-123");
      assert.equal(submitBody.deceased.furtherInformation, "Further info");

      assert.deepEqual(submitBody.proceedings, [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
        },
      ]);
      assert.deepEqual(submitBody.publicBodies, [
        {
          publicBodyDescription: "Home Office",
        },
      ]);

      assert.equal(requestStub.session.applicationReferenceNumber, "APP-123");

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(redirectArgs[0], "/apply/confirmation/success");
    });
  });
});
