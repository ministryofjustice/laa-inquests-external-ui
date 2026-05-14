import { assert } from "chai";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import { PublicAuthorityValidator } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { Formatter } from "#src/utils/Formatter.js";

describe("PublicAuthority adaptor", () => {
  describe("renderPublicAuthoritySelectForm", () => {
    it("renders public authority selection form", () => {
      const formValidator = new PublicAuthorityValidator();
      const formatter = new Formatter();
      const adaptor = new PublicAuthorityAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      const expectedRenderOptions = {
        csrfToken: "abcdefg",
        publicAuthorityOptions: [
          { text: "Home Office", value: "home-office" },
          { text: "Ministry of Justice", value: "moj" },
          { text: "Cabinet Office", value: "cabinet-office" },
          {
            text: "Department for Education",
            value: "department-for-education",
          },
          {
            text: "Department for Business and Trade",
            value: "department-for-business-and-trade",
          },
          {
            text: "Department for Energy, Security and Net Zero",
            value: "department-for-enerygy-security-and-net-zero",
          },
          {
            text: "Department of Culture, Media and Sport",
            value: "department-of-culture-media-and-sport",
          },
          {
            text: "Department for Transport",
            value: "department-for-transport",
          },
          {
            text: "Department of Work and Pensions",
            value: "department-of-work-and-pensions",
          },
          {
            text: "Department of Health and Social Care",
            value: "department-of-health-and-social-care",
          },
          {
            text: "Foreign, Commonwealth and Development Office",
            value: "foreign-commonwealth-and-development-office",
          },
          { text: "HM Treasury", value: "hm-treasury" },
        ],
        publicAuthorityOption: undefined,
        selectedPublicAuthorities: [],
      };

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert(renderArgs[0], "apply/public-authority/add-public-authority");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });
  });

  describe("processPublicAuthorityForm", () => {
    it("adds selected public authority to session", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        publicAuthorityOption: "moj",
      };

      const expectedSelected = {
        publicAuthorityId: "moj",
        publicAuthorityDescription: "Ministry of Justice",
      };

      adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.deepEqual(requestStub.session.selectedPublicAuthorities, [
        expectedSelected,
      ]);

      assert.deepEqual(
        requestStub.session.publicAuthorityOption,
        expectedSelected,
      );

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;

      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/public-authority/confirmation",
      );
    });

    it("renders error if nothing selected", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert.equal(
        renderArgs[0],
        "apply/public-authority/add-public-authority",
      );

      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noPublicAuthoritySelected: {
            text: "Please select a public authority",
          },
        },
      });
    });
  });

  describe("renderPublicAuthorityConfirmation", () => {
    it("renders confirmation with selected authorities", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
      ];

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      adaptor.renderPublicAuthorityConfirmation(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);

      const renderArgs = responseStub.render.getCall(0).args;

      assert.equal(renderArgs[0], "apply/public-authority/confirmation");

      assert.deepInclude(renderArgs[1], {
        selectedPublicAuthorities: [
          {
            key: { text: "moj" },
            value: { text: "Ministry of Justice" },
          },
        ],
      });
    });
  });

  describe("processPublicAuthorityConfirmation", () => {
    it("re-renders with error when no option selected", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.session.selectedPublicAuthorities = [];

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      adaptor.processPublicAuthorityConfirmation(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);

      const renderArgs = responseStub.render.getCall(0).args;

      assert.equal(renderArgs[0], "apply/public-authority/confirmation");

      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noConfirmationSelected: {
            text: "Please select either yes or no to continue.",
          },
        },
      });
    });

    it("redirects back to form if user selects yes", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        "add-another-public-authority": "true",
      };

      adaptor.processPublicAuthorityConfirmation(requestStub, responseStub);

      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/public-authority",
      );
    });

    it("redirects to next step if user selects no", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        "add-another-public-authority": "false",
      };

      adaptor.processPublicAuthorityConfirmation(requestStub, responseStub);

      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/check-your-answers",
      );
    });
  });
});
