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
            text: "Attorney General's Office",
            value: "attorney-generals-office",
          },
          { text: "Cabinet Office", value: "cabinet-office" },
          {
            text: "Department Devolved to Wales",
            value: "department-devolved-to-wales",
          },
          {
            text: "Department for Business and Trade",
            value: "department-for-business-and-trade",
          },
          {
            text: "Department for Culture, Media and Sport",
            value: "department-for-culture-media-and-sport",
          },
          {
            text: "Department for Education",
            value: "department-for-education",
          },
          {
            text: "Department for Energy Security and Net Zero",
            value: "department-for-energy-security-and-net-zero",
          },
          {
            text: "Department for Environment, Food and Rural Affairs",
            value: "department-for-environment-food-and-rural-affairs",
          },
          {
            text: "Department for Housing, Communities and Local Government",
            value: "department-for-housing-communities-and-local-government",
          },
          {
            text: "Department for Science, Innovation and Technology",
            value: "department-for-science-innovation-and-technology",
          },
          {
            text: "Department for Transport",
            value: "department-for-transport",
          },
          {
            text: "Department for Work and Pensions",
            value: "department-for-work-and-pensions",
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
          { text: "Home Office", value: "home-office" },
          { text: "Ministry of Defence", value: "ministry-of-defence" },
          { text: "Ministry of Justice", value: "ministry-of-justice" },
        ],
        selectedPublicAuthorityIds: [],
      };

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert(renderArgs[0], "apply/public-authority/add-public-authority");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });

    it("pre-populates the previously selected authorities from session", () => {
      const formValidator = new PublicAuthorityValidator();
      const formatter = new Formatter();
      const adaptor = new PublicAuthorityAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "abcdefg" };
      const previousSelections = [
        {
          publicAuthorityId: "cabinet-office",
          publicAuthorityDescription: "Cabinet Office",
        },
        {
          publicAuthorityId: "attorney-generals-office",
          publicAuthorityDescription: "Attorney General's Office",
        },
      ];
      requestStub.session.selectedPublicAuthorities = previousSelections;

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      assert.deepInclude(renderArgs[1], {
        selectedPublicAuthorityIds: [
          "cabinet-office",
          "attorney-generals-office",
        ],
      });
    });
  });

  describe("processPublicAuthorityForm", () => {
    it("sets multiple selected authorities in session and redirects", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        publicAuthorityOption: ["cabinet-office", "attorney-generals-office"],
      };

      const expectedSelected = [
        {
          publicAuthorityId: "cabinet-office",
          publicAuthorityDescription: "Cabinet Office",
        },
        {
          publicAuthorityId: "attorney-generals-office",
          publicAuthorityDescription: "Attorney General's Office",
        },
      ];

      adaptor.processPublicAuthorityForm(requestStub, responseStub);

      assert.deepEqual(
        requestStub.session.selectedPublicAuthorities,
        expectedSelected,
      );

      assert.equal(responseStub.redirect.callCount, 1);
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
            text: "Please select at least one public authority",
          },
        },
      });
    });
  });
});
