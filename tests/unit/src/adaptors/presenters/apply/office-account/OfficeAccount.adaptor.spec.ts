import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { OfficeAccountAdaptor } from "#src/adaptors/presenters/apply/OfficeAccount/OfficeAccount.adaptor.js";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";

const PROVIDER_OFFICES = [
  {
    officeCode: "0A123A",
    address: {
      addressLine1: "1 Test Street",
      addressLine2: "Suite 2",
      townOrCity: "London",
      county: "Greater London",
      postcode: "SW1A 1AA",
    },
  },
  {
    officeCode: "0A456A",
    address: {
      addressLine1: "2 Test Street",
      addressLine2: "",
      townOrCity: "Manchester",
      county: "",
      postcode: "M1A 1AA",
    },
  },
];

describe("OfficeAccount adaptor", () => {
  function buildAdaptor(getProviderOfficesPort?: GetProviderOfficesPort) {
    const port =
      getProviderOfficesPort ?? stubInterface<GetProviderOfficesPort>();
    return new OfficeAccountAdaptor(port);
  }

  describe("renderOfficeAccountSelectForm", () => {
    it("renders office account selection form with options from API", async () => {
      const port = stubInterface<GetProviderOfficesPort>();
      port.getProviderOffices.resolves(PROVIDER_OFFICES);
      const adaptor = buildAdaptor(port);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.query = { firmId: "123" };
      requestStub.session.accessToken = "access-token-123";
      responseStub.locals = { csrfToken: "abcdefg" };

      await adaptor.renderOfficeAccountSelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/office-account/select-office-account");
      assert.deepEqual(renderArgs[1], {
        csrfToken: "abcdefg",
        officeOptions: [
          {
            value: "0A123A",
            html: "<strong>1 Test Street, Suite 2, London, Greater London, SW1A 1AA</strong>",
            hint: { text: "0A123A" },
          },
          {
            value: "0A456A",
            html: "<strong>2 Test Street, Manchester, M1A 1AA</strong>",
            hint: { text: "0A456A" },
          },
        ],
      });
    });

    it("passes firmId from query and access token to provider offices port", async () => {
      const port = stubInterface<GetProviderOfficesPort>();
      port.getProviderOffices.resolves(PROVIDER_OFFICES);
      const adaptor = buildAdaptor(port);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.query = { firmId: "999" };
      requestStub.session.accessToken = "access-token-123";
      responseStub.locals = { csrfToken: "abcdefg" };

      await adaptor.renderOfficeAccountSelectForm(requestStub, responseStub);

      assert(
        port.getProviderOffices.calledOnceWithExactly(
          "999",
          "access-token-123",
        ),
      );
    });

    it("renders empty options when no firm id is provided", async () => {
      const port = stubInterface<GetProviderOfficesPort>();
      const adaptor = buildAdaptor(port);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.query = {};
      responseStub.locals = { csrfToken: "abcdefg" };

      await adaptor.renderOfficeAccountSelectForm(requestStub, responseStub);

      assert.equal(port.getProviderOffices.callCount, 0);
      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(renderModel.officeOptions, []);
    });

    it("throws when loading provider offices fails", async () => {
      const port = stubInterface<GetProviderOfficesPort>();
      port.getProviderOffices.rejects(new Error("Network error"));
      const adaptor = buildAdaptor(port);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.query = { firmId: "123" };
      responseStub.locals = { csrfToken: "abcdefg" };

      await assert.rejects(
        () => adaptor.renderOfficeAccountSelectForm(requestStub, responseStub),
        { message: "UNEXPECTED_EXCEPTION" },
      );
    });
  });
});
