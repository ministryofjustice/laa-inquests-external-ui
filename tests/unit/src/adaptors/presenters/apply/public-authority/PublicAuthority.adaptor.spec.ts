import { assert } from "chai";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import { PublicAuthorityValidator } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.validator.js";
import { Formatter } from "#src/utils/Formatter.js";

describe("PublicAuthority adaptor", () => {
  describe("renderPublicAuthoritySelectForm", () => {
    it("renders public authority selection form with all options", () => {
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
          {
            text: "Prime Minister's Office 10 Downing Street",
            value: "prime-ministers-office-10-downing-street",
          },
          { text: "Cabinet Office", value: "cabinet-office" },
          {
            text: "Attorney General's Office",
            value: "attorney-generals-office",
          },
          {
            text: "Department for Business & Trade",
            value: "department-for-business-and-trade",
          },
          {
            text: "Department for Culture, Media & Sport",
            value: "department-for-culture-media-and-sport",
          },
          {
            text: "Department for Education",
            value: "department-for-education",
          },
          {
            text: "Department for Energy Security & Net Zero",
            value: "department-for-energy-security-and-net-zero",
          },
          {
            text: "Department for Environment, Food & Rural Affairs",
            value: "department-for-environment-food-and-rural-affairs",
          },
          {
            text: "Department for Science, Innovation & Technology",
            value: "department-for-science-innovation-and-technology",
          },
          {
            text: "Department for Transport",
            value: "department-for-transport",
          },
          {
            text: "Department for Work & Pensions",
            value: "department-for-work-and-pensions",
          },
          {
            text: "Department of Health & Social Care",
            value: "department-of-health-and-social-care",
          },
        ],
        publicAuthorityOption: undefined,
      };

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert(renderArgs[0], "apply/public-authority/add-public-authority");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });

    it("pre-populates the previously selected authority from session", () => {
      const formValidator = new PublicAuthorityValidator();
      const formatter = new Formatter();
      const adaptor = new PublicAuthorityAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "abcdefg" };
      const previousSelection = {
        publicAuthorityId: "cabinet-office",
        publicAuthorityDescription: "Cabinet Office",
      };
      requestStub.session.selectedPublicAuthorities = [previousSelection];

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      assert.deepInclude(renderArgs[1], {
        publicAuthorityOption: previousSelection,
      });
    });
  });

  describe("processPublicAuthorityForm", () => {
    it("sets selected public authority in session and redirects to upload coroner's letter", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        publicAuthorityOption: "cabinet-office",
      };

      const expectedSelected = {
        publicAuthorityId: "cabinet-office",
        publicAuthorityDescription: "Cabinet Office",
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
        "/apply/upload-coroners-letter",
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
});
