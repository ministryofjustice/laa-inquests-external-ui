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
    it("renders public authority selection form with options from API", async () => {
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
        ],
        selectedPublicAuthorityIds: [],
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

    it("does not call API when public authorities are already in session", async () => {
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
      ];

      assert.equal(actual.csrfToken, "abcdefg");
      assert.deepEqual(actual.publicAuthorityOptions, expectedOptions);
      assert.deepEqual(
        (actual.selectedPublicAuthorityIds as string[]).sort(),
        ["Attorney General's Office", "Cabinet Office"].sort(),
      );
    });

    it("throws when loading public bodies fails", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.rejects(
        new Error("Network error"),
      );
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      await assert.rejects(
        () =>
          adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub),
        { message: "UNEXPECTED_EXCEPTION" },
      );
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
          publicAuthorityDescription: body.publicBodyDescription,
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
        ],
        selectedPublicAuthorityIds: [],
        errorSummaries: {
          noPublicAuthoritySelected: {
            text: "Please select at least one public authority",
          },
        },
      });
    });

    it("throws when loading public bodies fails", async () => {
      const getPublicAuthoritiesPort =
        stubInterface<GetPublicAuthoritiesPort>();
      getPublicAuthoritiesPort.getPublicAuthorities.rejects(
        new Error("Network error"),
      );
      const adaptor = buildAdaptor(getPublicAuthoritiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      await assert.rejects(
        () => adaptor.processPublicAuthorityForm(requestStub, responseStub),
        { message: "UNEXPECTED_EXCEPTION" },
      );
    });
  });
});
