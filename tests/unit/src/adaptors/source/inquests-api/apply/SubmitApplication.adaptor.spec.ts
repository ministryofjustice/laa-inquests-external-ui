import { assert } from "chai";
import { AxiosInstance } from "axios";
import { stubInterface } from "ts-sinon";
import { SubmitApplicationAdaptor } from "#src/adaptors/source/inquests-api/apply/SubmitApplication/SubmitApplication.adaptor.js";
import { formatDateDDMMYYYY } from "#src/utils/dateFormatter.js";

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
      };

      const applicationResponse =
        await submitApplicationAdaptor.submitApplication(submitBodyRaw);

      assert(axiosStub.post.calledOnce);
      assert(
        axiosStub.post.calledWith(
          "http://localhost/applications",
          submitBodyRaw,
        ),
      );
      assert.deepEqual(expectedApiResponse, applicationResponse);
    });
  });
});
