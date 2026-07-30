import { strict as assert } from "assert";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response } from "express";
import { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import { PublicAuthorityValidator } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { Formatter } from "#src/utils/Formatter.js";
import type { GetPublicBodiesPort } from "#src/ports/source/inquests-api/GetPublicBodies.port.js";

const API_PUBLIC_BODIES = [
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
  function buildAdaptor(getPublicBodiesPort?: GetPublicBodiesPort) {
    const port = getPublicBodiesPort ?? stubInterface<GetPublicBodiesPort>();
    return new PublicAuthorityAdaptor(
      new PublicAuthorityValidator(),
      new Formatter(),
      port,
    );
  }

  describe("renderPublicAuthoritySelectForm", () => {
    it("renders public authority selection form with options from API", async () => {
      const getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
      getPublicBodiesPort.getPublicBodies.resolves(API_PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicBodiesPort);

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

    it("pre-populates previously selected authorities from session", async () => {
      const getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
      getPublicBodiesPort.getPublicBodies.resolves(API_PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicBodiesPort);

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
        selectedPublicAuthorityIds: [
          "Cabinet Office",
          "Attorney General's Office",
        ],
      });
    });

    it("renders the 503 error page when loading public bodies fails", async () => {
      const getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
      getPublicBodiesPort.getPublicBodies.rejects(new Error("Network error"));
      const adaptor = buildAdaptor(getPublicBodiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.status.returns(responseStub);

      await adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(responseStub.status.callCount, 1);
      assert.equal(responseStub.status.getCall(0).args[0], 503);
      assert.equal(responseStub.render.callCount, 1);
      assert.deepEqual(responseStub.render.getCall(0).args, [
        "main/error",
        {
          status: "503",
          error: "Service unavailable. Please try again later.",
        },
      ]);
    });
  });

  describe("processPublicAuthorityForm", () => {
    it("sets selected authorities in session and redirects", async () => {
      const getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
      getPublicBodiesPort.getPublicBodies.resolves(API_PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicBodiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

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

    it("renders error if nothing is selected", async () => {
      const getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
      getPublicBodiesPort.getPublicBodies.resolves(API_PUBLIC_BODIES);
      const adaptor = buildAdaptor(getPublicBodiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.accessToken = "access-token-123";

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

    it("renders 503 error page when loading public bodies fails", async () => {
      const getPublicBodiesPort = stubInterface<GetPublicBodiesPort>();
      getPublicBodiesPort.getPublicBodies.rejects(new Error("Network error"));
      const adaptor = buildAdaptor(getPublicBodiesPort);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.status.returns(responseStub);

      await adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.equal(responseStub.status.callCount, 1);
      assert.equal(responseStub.status.getCall(0).args[0], 503);
      assert.equal(responseStub.render.callCount, 1);
      assert.deepEqual(responseStub.render.getCall(0).args, [
        "main/error",
        {
          status: "503",
          error: "Service unavailable. Please try again later.",
        },
      ]);
    });
  });
});
