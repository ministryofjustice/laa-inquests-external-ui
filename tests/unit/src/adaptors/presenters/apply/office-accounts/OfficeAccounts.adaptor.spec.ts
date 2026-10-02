import { strict as assert } from "assert";
import type { Request, Response } from "express";
import { stubInterface } from "ts-sinon";
import { OfficeAccountsAdaptor } from "#src/adaptors/presenters/apply/OfficeAccounts/OfficeAccounts.adaptor.js";
import type { GetProviderOfficesPort } from "#src/ports/source/inquests-api/GetProviderOffices.port.js";
import { OFFICE_ACCOUNTS_ERROR } from "#src/infrastructure/locales/constants.js";

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
  firmName?: string;
  accessToken?: string;
  userOfficeAccounts?: string[];
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
    requestStub.session.firmName = options?.firmName;
    requestStub.session.accessToken =
      options?.accessToken ?? "access-token-123";
    requestStub.session.userOfficeAccounts = options?.userOfficeAccounts ?? [
      "0A123A",
      "0A456A",
      "0A789A",
    ];

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
        selectedOfficeAccount: undefined,
      });
    });

    it("passes the previously selected office from session to the view", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures();
      requestStub.session.selectedOfficeAccount = "0A456A";

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      const renderModel = responseStub.render.getCall(0)
        .args[1] as unknown as Record<string, unknown>;
      assert.equal(renderModel.selectedOfficeAccount, "0A456A");
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

    it("prefixes office addresses with the firm name from session", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        firmName: "Test Firm",
      });

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(renderModel.officeOptions, [
        {
          value: "0A123A",
          html: "<strong>Test Firm, 1 Test Street, Suite 2, London, Greater London, SW1A 1AA</strong>",
          hint: { text: "0A123A" },
        },
        {
          value: "0A456A",
          html: "<strong>Test Firm, 2 Test Street, Manchester, M1A 1AA</strong>",
          hint: { text: "0A456A" },
        },
        {
          value: "0A789A",
          html: "<strong>Test Firm, 3 Test Street, Leeds, LS1 1AA</strong>",
          hint: { text: "0A789A" },
        },
      ]);
    });

    it("escapes HTML characters in the firm name", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        firmName: "Firm & <Co>",
      });

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(
        (renderModel.officeOptions as { html: string }[])[0].html,
        "<strong>Firm &amp; &lt;Co&gt;, 1 Test Street, Suite 2, London, Greater London, SW1A 1AA</strong>",
      );
    });

    it("escapes HTML characters in office addresses", async () => {
      const { port, adaptor, requestStub, responseStub } =
        createRenderFixtures();
      port.getProviderOffices.resolves([
        {
          officeCode: "0A123A",
          address: {
            addressLine1: "<img src=x>",
            addressLine2: "",
            townOrCity: "London",
            county: "",
            postcode: "SW1A 1AA",
          },
        },
      ]);

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(
        (renderModel.officeOptions as { html: string }[])[0].html,
        "<strong>&lt;img src=x&gt;, London, SW1A 1AA</strong>",
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

    it("propagates the error unchanged when loading provider offices fails", async () => {
      const { port, requestStub, responseStub } = createRenderFixtures({
        firmId: "123",
      });
      const portError = new Error("Network error");
      port.getProviderOffices.rejects(portError);
      const failingAdaptor = new OfficeAccountsAdaptor(port);

      await assert.rejects(
        () =>
          failingAdaptor.renderOfficeAccountsSelectForm(
            requestStub,
            responseStub,
          ),
        (error: unknown) => {
          assert.equal(error, portError);
          return true;
        },
      );
    });

    it("only shows offices the logged-in user's userOfficeAccounts includes", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        firmId: "123",
        userOfficeAccounts: ["0A456A"],
      });

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(renderModel.officeOptions, [
        {
          value: "0A456A",
          html: "<strong>2 Test Street, Manchester, M1A 1AA</strong>",
          hint: { text: "0A456A" },
        },
      ]);
    });

    it("renders empty options when the session has no userOfficeAccounts", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        firmId: "123",
        userOfficeAccounts: [],
      });

      await adaptor.renderOfficeAccountsSelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.deepEqual(renderModel.officeOptions, []);
    });
  });

  describe("processOfficeAccountsSelectForm", () => {
    it("redirects to client name and dob page when an office is selected", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures();
      requestStub.body = { "office-accounts": "0A123A" };

      await adaptor.processOfficeAccountsSelectForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.firstCall.args[0],
        "/apply/client-details/name-and-dob",
      );
    });

    it("stores the selected office in session when an office is selected", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures();
      requestStub.body = { "office-accounts": "0A456A" };

      await adaptor.processOfficeAccountsSelectForm(requestStub, responseStub);

      assert.equal(requestStub.session.selectedOfficeAccount, "0A456A");
    });

    it("does not store an office in session when validation fails", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        userOfficeAccounts: ["0A123A"],
      });
      requestStub.body = { "office-accounts": "0A999Z" };

      await adaptor.processOfficeAccountsSelectForm(requestStub, responseStub);

      assert.equal(requestStub.session.selectedOfficeAccount, undefined);
      assert.equal(responseStub.redirect.callCount, 0);
      assert.equal(responseStub.render.callCount, 1);
    });

    it("re-renders the form with office options and an error when no office is selected", async () => {
      const { adaptor, requestStub, responseStub } = createRenderFixtures({
        userOfficeAccounts: ["0A456A"],
      });
      requestStub.body = {};

      await adaptor.processOfficeAccountsSelectForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 0);
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
            value: "0A456A",
            html: "<strong>2 Test Street, Manchester, M1A 1AA</strong>",
            hint: { text: "0A456A" },
          },
        ],
        errorSummaries: {
          noOfficeSelected: { text: OFFICE_ACCOUNTS_ERROR.NO_OFFICE_SELECTED },
        },
      });
    });
  });
});
