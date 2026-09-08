import { strict as assert } from "assert";
import type { Request, Response } from "express";
import { stubInterface } from "ts-sinon";
import { OfficeAccountsAdaptor } from "#src/adaptors/presenters/apply/OfficeAccounts/OfficeAccounts.adaptor.js";
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
  {
    officeCode: "0A789A",
    address: {
      addressLine1: "3 Test Street",
      addressLine2: null,
      townOrCity: "Leeds",
      county: null,
      postcode: "LS1 1AA",
    },
  },
];

interface RenderFixturesOptions {
  firmId?: string;
  accessToken?: string;
}

describe("OfficeAccounts adaptor", () => {
  function createRenderFixtures(options?: RenderFixturesOptions): {
    port: ReturnType<typeof stubInterface<GetProviderOfficesPort>>;
    adaptor: OfficeAccountsAdaptor;
    requestStub: ReturnType<typeof stubInterface<Request>>;
    responseStub: ReturnType<typeof stubInterface<Response>>;
  } {
    const port = stubInterface<GetProviderOfficesPort>();
    port.getProviderOffices.resolves(PROVIDER_OFFICES);
    const adaptor = new OfficeAccountsAdaptor(port);

    const requestStub = stubInterface<Request>();
    requestStub.query = {};
    requestStub.session.firmId = options?.firmId ?? "123";
    requestStub.session.accessToken =
      options?.accessToken ?? "access-token-123";

    const responseStub = stubInterface<Response>();
    responseStub.locals = { csrfToken: "abcdefg" };

    return { port, adaptor, requestStub, responseStub };
  }

  describe("renderOfficeAccountsSelectForm", () => {
    it("renders office accounts selection form with options from API", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        firmId: "123",
      });

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(
        renderArgs[0],
        "apply/office-accounts/select-office-account",
      );
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
          {
            value: "0A789A",
            html: "<strong>3 Test Street, Leeds, LS1 1AA</strong>",
            hint: { text: "0A789A" },
          },
        ],
      });
    });

    it("passes firmId from authenticated session and access token to provider offices port", async () => {
      const { port, adaptor, requestStub, responseStub } = createRenderFixtures(
        {
          firmId: "999",
        },
      );

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      assert(
        port.getProviderOffices.calledOnceWithExactly(
          "999",
          "access-token-123",
        ),
      );
    });

    it("renders empty options when no firm id is available in session", async () => {
      const { port, adaptor, requestStub, responseStub } = createRenderFixtures(
        { firmId: "" },
      );

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      assert.equal(port.getProviderOffices.callCount, 0);
      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(renderModel.officeOptions, []);
    });

    it("throws when loading provider offices fails", async () => {
      const { port, requestStub, responseStub } = createRenderFixtures({
        firmId: "123",
      });
      port.getProviderOffices.rejects(new Error("Network error"));
      const failingAdaptor = new OfficeAccountsAdaptor(port);

      await assert.rejects(
        () =>
          failingAdaptor.renderOfficeAccountsSelectForm(
            requestStub,
            responseStub,
          ),
        { message: "UNEXPECTED_EXCEPTION" },
      );
    });
  });
});
