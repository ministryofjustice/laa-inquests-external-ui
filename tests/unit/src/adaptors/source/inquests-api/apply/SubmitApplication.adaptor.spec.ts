import { assert } from "chai";
import sinon from "sinon";
import { AxiosInstance } from "axios";
import { stubInterface } from "ts-sinon";
import { SubmitApplicationAdaptor } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/SubmitApplication.adaptor.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";
import {
  APPLICATION_ERROR_TYPES,
  isApplicationError,
} from "#src/use-cases/common/ApplicationError.js";
import { v4 as uuidv4 } from "uuid";

describe("SubmitApplicationAdaptor", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("submitApplication", () => {
    it("submits an application", async () => {
      let axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.resolves({
        data: { laaReference: "12345678910" },
        status: 201,
      });

      const expectedApiResponse = {
        laaReference: "12345678910",
      };

      const submitApplicationAdaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
      );

      const testCoronersLetterId = uuidv4();

      const selectedProceeding = {
        proceedingId: "IQCN",
      };

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
        proceeding: selectedProceeding,
        publicBodies: selectedPublicAuthorities,
        provider: {
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
      axiosStub.post.resolves({ data: { laaReference: "1" }, status: 201 });
      const logDebugSpy = sinon.spy(logger, "logDebug");

      const adaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
        true,
      );

      const minimalBody = {
        coronersLetterId: "x",
        client: {
          clientFirstName: "A",
          clientLastName: "B",
          dateOfBirth: "01/01/1990",
          hasNoFixedAbode: false,
          correspondenceAddressSource: "USE_PROVIDER_ADDRESS" as const,
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
        proceeding: {
          proceedingId: "IQCA",
        },
        publicBodies: [],
        provider: { officeId: "Y", emailAddress: "z@z.com" },
      };

      await adaptor.submitApplication(minimalBody, "access-token-123");

      assert.ok(logDebugSpy.calledOnce);
      assert.deepEqual(logDebugSpy.firstCall.args, [
        {
          functionName: "submitApplication",
          message: "DEBUG APPLICATION BODY NOT SUITABLE FOR PRODUCTION",
          extraContext: {
            event: "submit_application_payload_debug",
            application: minimalBody,
          },
        },
      ]);
    });

    it("does not log the payload when payloadDebugEnabled is false", async () => {
      const axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.resolves({ data: { laaReference: "1" }, status: 201 });
      const logDebugSpy = sinon.spy(logger, "logDebug");

      const adaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
        false,
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
          proceeding: {
            proceedingId: "IQCA",
          },
          publicBodies: [],
          provider: { officeId: "Y", emailAddress: "z@z.com" },
        },
        "access-token-123",
      );

      assert.ok(logDebugSpy.notCalled);
    });

    it("throws an authentication ApplicationError when the access token is missing", async () => {
      const axiosStub = stubInterface<AxiosInstance>();
      const adaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
      );

      let thrown: unknown;
      try {
        await adaptor.submitApplication(minimalSubmitBody, undefined);
        assert.fail("expected submitApplication to throw");
      } catch (error) {
        thrown = error;
      }

      assert.isTrue(isApplicationError(thrown));
      assert.equal(
        (thrown as { type: string }).type,
        APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
      );
      assert.equal(
        (thrown as { operation: string }).operation,
        "submit_application",
      );
      assert.isTrue(axiosStub.post.notCalled);
    });

    it("translates upstream failures into an ApplicationError", async () => {
      const axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.rejects({
        isAxiosError: true,
        code: "ECONNRESET",
        message: "Network error",
      });
      const adaptor = new SubmitApplicationAdaptor(
        axiosStub,
        "http://localhost",
      );

      let thrown: unknown;
      try {
        await adaptor.submitApplication(minimalSubmitBody, "access-token-123");
        assert.fail("expected submitApplication to throw");
      } catch (error) {
        thrown = error;
      }

      assert.isTrue(isApplicationError(thrown));
      assert.equal(
        (thrown as { type: string }).type,
        APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
      );
      assert.equal(
        (thrown as { operation: string }).operation,
        "submit_application",
      );
    });
  });
});

const minimalSubmitBody = {
  coronersLetterId: "x",
  client: {
    clientFirstName: "A",
    clientLastName: "B",
    dateOfBirth: "01/01/1990",
    hasNoFixedAbode: false,
    correspondenceAddressSource: "USE_PROVIDER_ADDRESS" as const,
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
  proceeding: {
    proceedingId: "IQCA",
  },
  publicBodies: [],
  provider: { officeId: "Y", emailAddress: "z@z.com" },
};
