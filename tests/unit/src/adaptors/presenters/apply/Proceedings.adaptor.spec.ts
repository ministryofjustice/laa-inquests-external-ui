import { assert } from "chai";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ProceedingsAdaptor } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.adaptor.js";
import { ProceedingsValidator } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.validator.js";
import { Formatter } from "#src/utils/Formatter.js";

describe("Proceedings adaptor", () => {
  describe("renderProceedingSelectForm", () => {
    it("renders proceeding selection form", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };
      const expectedRenderOptions = {
        csrfToken: "abcdefg",
        proceedingOptions: [
          {
            text: "Death in police custody",
            value: "IQPC",
          },
          {
            text: "Death in prison",
            value: "IQPO",
          },
          {
            text: "Death during medical treatment",
            value: "IQMT",
          },
          {
            text: "Death in mental health detention",
            value: "IQMH",
          },
          {
            text: "Death relating to mental health care in the community",
            value: "IQMC",
          },
          {
            text: "Death relating to other care in the community",
            value: "IQCC",
          },
          {
            text: "Death relating to issues with condition/safety of housing",
            value: "IQHO",
          },
          {
            text: "Death relating to a child’s care arrangements",
            value: "IQCA",
          },
          {
            text: "Death relating to failure to prevent domestic violence",
            value: "IQDV",
          },
          {
            text: "Death relating to issues in an educational setting",
            value: "IQED",
          },
          {
            text: "Death relating to issues relating to transport",
            value: "IQTR",
          },
          {
            text: "Other",
            value: "IQOT",
          },
        ],
        proceedingInput: undefined,
        selectedProceedings: [],
      };
      proceedingsAdaptor.renderProceedingSelectForm(requestStub, responseStub);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert(renderArgs[0], "apply/proceedings/add-proceedings");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });
  });
  describe("processProceedingsForm", () => {
    it("adds selected proceedings to the session object", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      const expectedSelectedProceeding = {
        proceedingId: "IQPC",
        proceedingName: "Death in police custody",
        matterType: "INQUEST",
      };

      requestStub.body = {
        "proceeding-option": "IQPC",
      };

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      proceedingsAdaptor.processProceedingsForm(requestStub, responseStub);
      assert.deepEqual(requestStub.session.selectedProceedings, [
        expectedSelectedProceeding,
      ]);
      assert.deepEqual(
        requestStub.session.proceedingOption,
        expectedSelectedProceeding,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert(redirectArgs[0], "/apply/proceedings/confirmation");
    });
    it("renders error message if no proceeding option is selected", async () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      proceedingsAdaptor.processProceedingsForm(requestStub, responseStub);
      assert.deepEqual(requestStub.session.selectedProceedings, undefined);
      assert.deepEqual(requestStub.session.proceedingOption, undefined);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert(renderArgs[0], "apply/proceedings/add-proceedings");

      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noProceedingSelected: {
            text: "An application must specify at least one related proceeding.",
          },
        },
      });
    });
  });
  describe("renderProceedingsConfirmation", () => {
    it("renders proceeding confirmation form with single selected proceeding", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      const selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingName: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedProceedings = selectedProceedings;

      const expectedFormattedProceedings = [
        {
          key: { text: "Clinical Negligence" },
          actions: {
            items: [
              {
                href: "/apply/proceedings/remove?proceedingId=MN035",
                text: "Remove",
              },
            ],
          },
        },
      ];

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      const expectedRenderOptions = {
        csrfToken: "abcdefg",
        selectedProceedings: expectedFormattedProceedings,
      };

      proceedingsAdaptor.renderProceedingsConfirmation(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert(renderArgs[0], "apply/proceedings/confirmation");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });
  });
  describe("processProceedingsConfirmation", () => {
    it("re-renders the confirmation page with error if no option is selected", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      requestStub.session.selectedProceedings = [];

      const expectedRenderOptions = {
        csrfToken: "abcdefg",
        errorSummaries: {
          noConfirmationSelected: {
            text: "Please select either yes or no to continue.",
          },
        },
        selectedProceedings: [],
      };
      proceedingsAdaptor.processProceedingsConfirmation(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert(renderArgs[0], "apply/proceedings/confirmation");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });
    it("redirects to deceased details page if no is selected and list has items", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.body = {
        _csrf: "abcdefg",
        "add-another-proceeding": "false",
      };
      requestStub.session.selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingName: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      proceedingsAdaptor.processProceedingsConfirmation(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert(redirectArgs[0], "/apply/deceased-details/name");
    });
    it("re-renders with error if no is selected and list is empty", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      requestStub.body = {
        _csrf: "abcdefg",
        "add-another-proceeding": "false",
      };
      requestStub.session.selectedProceedings = [];

      proceedingsAdaptor.processProceedingsConfirmation(
        requestStub,
        responseStub,
      );

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert(renderArgs[0], "apply/proceedings/confirmation");
      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noProceedingsInList: {
            text: "A case must have a minimum of 1 proceeding",
          },
        },
      });
    });
    it("redirects to form page if yes selected", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.body = {
        _csrf: "abcdefg",
        "add-another-proceeding": "true",
      };

      proceedingsAdaptor.processProceedingsConfirmation(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert(redirectArgs[0], "/apply/proceedings");
    });
  });
});
