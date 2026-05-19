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
        selectedPublicAuthorities: [],
        isAddingAnother: false,
      };

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert(renderArgs[0], "apply/public-authority/add-public-authority");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });
    it("passes isAddingAnother as true when public authorities are already selected", () => {
      const formValidator = new PublicAuthorityValidator();
      const formatter = new Formatter();
      const adaptor = new PublicAuthorityAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "abcdefg" };
      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
      ];

      adaptor.renderPublicAuthoritySelectForm(requestStub, responseStub);

      const renderArgs = responseStub.render.getCall(0).args;
      assert.deepInclude(renderArgs[1], { isAddingAnother: true });
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
        isAddingAnother: false,
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
            key: { text: "Ministry of Justice" },
            actions: {
              items: [
                {
                  href: "/apply/public-authority/remove?publicAuthorityId=moj",
                  text: "Remove",
                },
              ],
            },
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
    it("re-renders with error when no is selected and list is empty", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        "add-another-public-authority": "false",
      };
      requestStub.session.selectedPublicAuthorities = [];

      responseStub.locals = { csrfToken: "abcdefg" };

      adaptor.processPublicAuthorityConfirmation(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/public-authority/confirmation");
      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noPublicAuthoritiesInList: {
            text: "A case must have a minimum of 1 interested party",
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
      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
      ];

      adaptor.processPublicAuthorityConfirmation(requestStub, responseStub);

      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/check-your-answers",
      );
    });
  });
  describe("renderPublicAuthorityRemoveForm", () => {
    it("renders the remove public authority page when the id exists", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.query = {
        publicAuthorityId: "moj",
      };
      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
      ];

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      adaptor.renderPublicAuthorityRemoveForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert.equal(
        renderArgs[0],
        "apply/public-authority/remove-public-authority",
      );
      assert.deepInclude(renderArgs[1], {
        csrfToken: "abcdefg",
        publicAuthorityName: "Ministry of Justice",
        publicAuthorityId: "moj",
      });
    });

    it("redirects to confirmation when the id is not found", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.query = {
        publicAuthorityId: "not-found",
      };
      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
      ];

      adaptor.renderPublicAuthorityRemoveForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/public-authority/confirmation",
      );
    });
  });

  describe("processPublicAuthorityRemove", () => {
    it("removes the selected authority and sets a success message when yes is selected", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.body = {
        publicAuthorityId: "moj",
        "remove-public-authority": "true",
      };
      requestStub.session.selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ];

      adaptor.processPublicAuthorityRemove(requestStub, responseStub);

      assert.deepEqual(requestStub.session.selectedPublicAuthorities, [
        {
          publicAuthorityId: "home-office",
          publicAuthorityDescription: "Home Office",
        },
      ]);
      assert.equal(
        requestStub.session.successMessage,
        "Public authority has been removed",
      );

      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/public-authority/confirmation",
      );
    });

    it("does not remove the authority when no is selected", () => {
      const adaptor = new PublicAuthorityAdaptor(
        new PublicAuthorityValidator(),
        new Formatter(),
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      const selectedPublicAuthorities = [
        {
          publicAuthorityId: "moj",
          publicAuthorityDescription: "Ministry of Justice",
        },
      ];
      requestStub.body = {
        publicAuthorityId: "moj",
        "remove-public-authority": "false",
      };
      requestStub.session.selectedPublicAuthorities = selectedPublicAuthorities;

      adaptor.processPublicAuthorityRemove(requestStub, responseStub);

      assert.deepEqual(
        requestStub.session.selectedPublicAuthorities,
        selectedPublicAuthorities,
      );
      assert.isUndefined(requestStub.session.successMessage);

      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/public-authority/confirmation",
      );
    });
  });
});
