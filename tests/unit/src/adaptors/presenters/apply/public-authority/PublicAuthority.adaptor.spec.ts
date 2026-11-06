import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import { PublicAuthorityValidator } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { Formatter } from "#src/utils/Formatter.js";
import type { GetPublicAuthoritiesPort } from "#src/ports/source/inquests-api/GetPublicAuthorities.port.js";

const PUBLIC_BODIES = [
  {
    publicBodyId: "Attorney General's Office",
    publicBodyDescription: "Attorney General's Office",
  },
  {
    publicBodyId: "Cabinet Office",
    publicBodyDescription: "Cabinet Office",
  },
  {
    publicBodyId: "Department for Transport",
    publicBodyDescription: "Department for Transport",
  },
  {
    publicBodyId: "Department Devolved to Wales",
    publicBodyDescription: "Department Devolved to Wales",
  },
];

describe("PublicAuthority adaptor", () => {
  function buildAdaptor(getPublicAuthoritiesPort?: GetPublicAuthoritiesPort) {
    const port =
      getPublicAuthoritiesPort ?? stubInterface<GetPublicAuthoritiesPort>();
    return new PublicAuthorityAdaptor(
      new PublicAuthorityValidator(),
      new Formatter(),
      port,
    );
  }

  describe("renderPublicAuthoritySelectForm", () => {
    it("renders interested party (public authority) selection form with options from API", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.resolves(PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      const expectedRenderOptions = {
        csrfToken: "abcdefg",
        publicAuthorityOptions: [
          {
            text: "Attorney General's Office",
            value: "Attorney General's Office",
          },
          { text: "Cabinet Office", value: "Cabinet Office" },
          {
            text: "Department for Transport",
            value: "Department for Transport",
          },
          {
            text: "Power devolved to Wales",
            value: "Department Devolved to Wales",
          },
        ],
        selectedPublicAuthorityIds: [],
        backHref: "/apply/deceased-details/further-information",
      };

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert.equal(
        renderArgs[0],
        "apply/public-authority/add-public-authority",
      );
      assert.deepEqual(renderArgs[1], expectedRenderOptions);
    });

    it("does not call API when interested parties(public authorities)are already in session", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";
      requestStub.session.availablePublicAuthorities = PUBLIC_BODIES.map(
        (body) => ({
          publicAuthorityId: body.publicBodyId,
          publicAuthorityDescription: body.publicBodyDescription,
        }),
      );

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(getPublicAuthoritiesPort.getPublicAuthorities.callCount, 0);
    });

    it("pre-populates previously selected authorities from session", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.resolves(PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

      responseStub.locals = { csrfToken: "abcdefg" };
      const previousSelections = [
        {
          publicAuthorityId: "Cabinet Office",
          publicAuthorityDescription: "Cabinet Office",
        },
        {
          publicAuthorityId: "Attorney General's Office",
          publicAuthorityDescription: "Attorney General's Office",
        },
      ];
      requestStub.session.selectedPublicAuthorities = previousSelections;

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const actual = renderArgs[1] as unknown as Record<string, unknown>;
      const expectedOptions = [
        {
          text: "Attorney General's Office",
          value: "Attorney General's Office",
        },
        { text: "Cabinet Office", value: "Cabinet Office" },
        {
          text: "Department for Transport",
          value: "Department for Transport",
        },
        {
          text: "Power devolved to Wales",
          value: "Department Devolved to Wales",
        },
      ];

      assert.equal(actual.csrfToken, "abcdefg");
      assert.deepEqual(actual.publicAuthorityOptions, expectedOptions);
      assert.deepEqual(
        (actual.selectedPublicAuthorityIds as string[]).sort(),
        ["Attorney General's Office", "Cabinet Office"].sort(),
      );
    });

    it("propagates the error unchanged when loading public bodies fails", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      const portError = new Error("Network error");
      getPublicAuthoritiesPort.getPublicAuthorities.rejects(portError);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      await assert.rejects(
        () =>
          adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub),
        (error: unknown) => {
          assert.equal(error, portError);
          return true;
        },
      );
    });

    it("captures check-your-answers origin and sets check-your-answers backHref", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.resolves(PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.query = { from: "check-your-answers" };
      requestStub.session.accessToken = "access-token-123";

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(requestStub.session.returnToApplyCheckYourAnswers, true);
      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(renderModel.backHref, "/apply/check-your-answers");
    });
  });

  describe("processPublicAuthorityForm", () => {
    it("sets selected authorities in session and redirects", async () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.availablePublicAuthorities = PUBLIC_BODIES.map(
        (body) => ({
          publicAuthorityId: body.publicBodyId,
          publicAuthorityDescription: body.publicBodyDescription,
        }),
      );

      requestStub.body = {
        publicAuthorityOption: ["Cabinet Office", "Attorney General's Office"],
      };

      const expectedSelected = [
        {
          publicAuthorityId: "Cabinet Office",
          publicAuthorityDescription: "Cabinet Office",
        },
        {
          publicAuthorityId: "Attorney General's Office",
          publicAuthorityDescription: "Attorney General's Office",
        },
      ];

      await adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.deepEqual(
        requestStub.session.selectedPublicAuthorities,
        expectedSelected,
      );

      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/apply/upload-coroners-letter",
      );
    });

    it("falls back to API when session cache is empty", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.resolves(PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

      requestStub.body = {
        publicAuthorityOption: ["Cabinet Office"],
      };

      await adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.equal(getPublicAuthoritiesPort.getPublicAuthorities.callCount, 1);
      assert.equal(responseStub.redirect.callCount, 1);
    });

    it("renders error if nothing is selected", async () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.availablePublicAuthorities = PUBLIC_BODIES.map(
        (body) => ({
          publicAuthorityId: body.publicBodyId,
          publicAuthorityDescription:
            body.publicBodyDescription === "Department Devolved to Wales"
              ? "Power devolved to Wales"
              : body.publicBodyDescription,
        }),
      );

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      await adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert.equal(
        renderArgs[0],
        "apply/public-authority/add-public-authority",
      );

      assert.deepEqual(renderArgs[1], {
        csrfToken: "abcdefg",
        publicAuthorityOptions: [
          {
            text: "Attorney General's Office",
            value: "Attorney General's Office",
          },
          { text: "Cabinet Office", value: "Cabinet Office" },
          {
            text: "Department for Transport",
            value: "Department for Transport",
          },
          {
            text: "Power devolved to Wales",
            value: "Department Devolved to Wales",
          },
        ],
        selectedPublicAuthorityIds: [],
        backHref: "/apply/deceased-details/further-information",
        errorSummaries: {
          noPublicAuthoritySelected: {
            text: "Please select at least one interested party",
          },
        },
      });
    });

    it("propagates the error unchanged when loading public bodies fails", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      const portError = new Error("Network error");
      getPublicAuthoritiesPort.getPublicAuthorities.rejects(portError);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      await assert.rejects(
        () => adaptor.processPublicAuthorityForm(requestStub, responseStub),
        (error: unknown) => {
          assert.equal(error, portError);
          return true;
        },
      );
    });

    it("redirects back to check-your-answers when return flag is set", async () => {
      const adaptor = buildAdaptor();

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.returnToApplyCheckYourAnswers = true;
      requestStub.session.availablePublicAuthorities = PUBLIC_BODIES.map(
        (body) => ({
          publicAuthorityId: body.publicBodyId,
          publicAuthorityDescription: body.publicBodyDescription,
        }),
      );

      requestStub.body = {
        publicAuthorityOption: ["Cabinet Office"],
      };

      await adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        responseStub.redirect.getCall(0).args[0],
        "/apply/check-your-answers",
      );
      assert.equal(
        requestStub.session.returnToApplyCheckYourAnswers,
        undefined,
      );
    });
  });

  describe("public authority name normalization", () => {
    it("transforms 'Department Devolved to Wales' to 'Power devolved to Wales'", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.resolves(PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      const options = renderModel.publicAuthorityOptions as Array<{
        text: string;
        value: string;
      }>;

      const departmentDevolvedOption = options.find(
        (opt) => opt.value === "Department Devolved to Wales",
      );

      assert.ok(
        departmentDevolvedOption,
        "Should find option with value 'Department Devolved to Wales'",
      );
      assert.equal(
        departmentDevolvedOption.text,
        "Power devolved to Wales",
        "Should display 'Power devolved to Wales' as the text",
      );
    });

    it("maintains alphabetical ordering after renaming 'Department Devolved to Wales' to 'Power devolved to Wales'", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.resolves(PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      const renderModel = renderArgs[1] as unknown as Record<string, unknown>;
      const options = renderModel.publicAuthorityOptions as Array<{
        text: string;
        value: string;
      }>;

      const optionTexts = options.map((opt) => opt.text);
      const sortedTexts = [...optionTexts].sort();

      assert.deepEqual(
        optionTexts,
        sortedTexts,
        "Options should be in alphabetical order",
      );
    });
  });
});
