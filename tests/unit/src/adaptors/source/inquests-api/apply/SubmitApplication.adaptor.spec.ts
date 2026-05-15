import { assert } from "chai";
import {AxiosInstance} from "axios";
import { stubInterface } from "ts-sinon";
import { SubmitApplicationAdaptor } from "#src/adaptors/source/inquests-api/apply/SubmitApplication.adaptor.js";
import { formatDateISO8601 } from "#src/utils/dateFormatter.js";

describe("SubmitApplicationAdaptor", () => {
  describe("submitApplication", () => {

    it("submits an application", async () => {

      let axiosStub = stubInterface<AxiosInstance>();
      axiosStub.post.resolves({
        data: { applicationReferenceNumber: "12345678910" },
        status: 201,
      });

      const expectedApiResponse = {
        applicationReferenceNumber: "12345678910",
        statusCode: 201,
      };

      const submitApplicationAdaptor = new SubmitApplicationAdaptor(axiosStub,"http://localhost");

      const selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
        },
      ];

      const selectedPublicAuthorities = [
        {
          publicBodyDescription: "Home Office",
        },
      ];

      const submitBodyRaw = {
        client: {
          clientFirstName: "first name",
          clientLastName: "last name",
          clientLastNameAtBirth: "last name at birth",
          clientDob: formatDateISO8601(1990, 1, 1),
          clientNino: "AB123456C",
          relationshipToDeceased: "child",
        },
        deceased: {
          deceasedFirstName: "deceased first name",
          deceasedLastName: "deceased last name",
          deceasedDob: formatDateISO8601(1960, 1, 1),
          deceasedDateOfDeath: formatDateISO8601(2020, 1, 1),
          coronersReference: "coroners reference",
          furtherInformation: "further information",
        },
        proceedings: selectedProceedings,
        publicBodies: selectedPublicAuthorities,
      };

      const applicationResponse = await submitApplicationAdaptor.submitApplication(submitBodyRaw);

      assert(axiosStub.post.calledOnce);
      assert(axiosStub.post.calledWith("http://localhost/application",submitBodyRaw));
      assert.deepEqual(expectedApiResponse, applicationResponse);
    });
  });
    
});
