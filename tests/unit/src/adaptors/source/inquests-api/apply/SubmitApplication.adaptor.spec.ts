import { assert } from "chai";
import sinon from "sinon";
import { AxiosInstance } from "axios";
import { stubInterface } from "ts-sinon";
import { SubmitApplicationAdaptor } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/SubmitApplication.adaptor.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";
import { v4 as uuidv4 } from "uuid";

describe("SubmitApplicationAdaptor", () => {
  describe("submitApplication", () => {
    it("submits an application", async () => {
      let axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.resolves({
        data: { laaReference: 12345678910 },
        status: 201,
      });

      const expectedApiResponse = {
        laaReference: 12345678910,
        statusCode: 201,
      };

      const submitApplicationAdaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
      );

      const testCoronersLetterId = uuidv4();

      const selectedProceedings = [
        {
          proceedingId: "MN035",
        },
      ];

      const selectedPublicAuthorities = [
        {
          publicBodyId: "Home Office",
        },
      ];

      const submitBodyRaw = {
        client: {
          clientFirstName: "first name",
          clientLastName: "last name",
          clientLastNameAtBirth: "last name at birth",
          dateOfBirth: formatDateDDMMYYYY(1990, "01", "01"),
          hasNoFixedAbode: false,
          correspondenceAddressSource: "USE_PROVIDER_ADDRESS" as const,
          isClientCorrespondenceRecipient: true,
          nationalInsuranceNumber: "AB123456C",
        },
        deceased: {
          deceasedFirstName: "deceased first name",
          deceasedLastName: "deceased last name",
          deceasedDateOfBirth: formatDateDDMMYYYY(1960, "01", "01"),
          deceasedDateOfDeath: formatDateDDMMYYYY(2020, "01", "01"),
          coronersReference: "coroners reference",
          furtherInformation: "further information",
          clientRelationshipToDeceased: "child",
        },
        proceedings: selectedProceedings,
        publicBodies: selectedPublicAuthorities,
        provider: {
          firmCode: "0A123B",
          officeId: "001",
          emailAddress: "test@example.com",
        },
        coronersLetterId: testCoronersLetterId,
      };

      const applicationResponse =
        await submitApplicationAdaptor.submitApplication(
          submitBodyRaw,
          "access-token-123",
        );

      assert(axiosStub.post.calledOnce);
      assert(
        axiosStub.post.calledWith(
          "http://localhost/applications/",
          submitBodyRaw,
          {
            headers: {
              Authorization: "Bearer access-token-123",
            },
          },
        ),
      );
      assert.deepEqual(expectedApiResponse, applicationResponse);
    });

    it("logs the payload when payloadDebugEnabled is true", async () => {
      const axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.resolves({ data: { laaReference: 1 }, status: 201 });
      const logger = sinon.spy();

      const adaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
        true,
        logger,
      );

      const minimalBody = {
        coronersLetterId: "x",
        client: {
          clientFirstName: "A",
          clientLastName: "B",
          dateOfBirth: "01/01/1990",
          hasNoFixedAbode: false,
          correspondenceAddressSource: "USE_PROVIDER_ADDRESS" as const,
          isClientCorrespondenceRecipient: true,
        },
        deceased: {
          deceasedFirstName: "D",
          deceasedLastName: "E",
          deceasedDateOfBirth: "01/01/1960",
          deceasedDateOfDeath: "01/01/2020",
          coronersReference: "",
          furtherInformation: "",
          clientRelationshipToDeceased: "child",
        },
        proceedings: [],
        publicBodies: [],
        provider: { firmCode: "X", officeId: "Y", emailAddress: "z@z.com" },
      };

      await adaptor.submitApplication(minimalBody, "access-token-123");

      assert.ok(logger.calledOnce);
      const logged = JSON.parse(logger.firstCall.args[0] as string) as {
        event: string;
      };
      assert.equal(logged.event, "submit.application.payload");
    });

    it("does not log the payload when payloadDebugEnabled is false", async () => {
      const axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.resolves({ data: { laaReference: 1 }, status: 201 });
      const logger = sinon.spy();

      const adaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
        false,
        logger,
      );

      await adaptor.submitApplication(
        {
          coronersLetterId: "x",
          client: {
            clientFirstName: "A",
            clientLastName: "B",
            dateOfBirth: "01/01/1990",
            hasNoFixedAbode: false,
            correspondenceAddressSource: "USE_PROVIDER_ADDRESS" as const,
            isClientCorrespondenceRecipient: true,
          },
          deceased: {
            deceasedFirstName: "D",
            deceasedLastName: "E",
            deceasedDateOfBirth: "01/01/1960",
            deceasedDateOfDeath: "01/01/2020",
            coronersReference: "",
            furtherInformation: "",
            clientRelationshipToDeceased: "child",
          },
          proceedings: [],
          publicBodies: [],
          provider: { firmCode: "X", officeId: "Y", emailAddress: "z@z.com" },
        },
        "access-token-123",
      );

      assert.ok(logger.notCalled);
    });
  });
});
