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
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = {
        csrfToken: "abcdefg",
      };
      const expectedRenderOptions = {
        csrfToken: "abcdefg",
        proceedingOptions: [
          {
            text: "CAPA",
            value: "PC049",
          },
          {
            text: "Clinical Negligence",
            value: "MN035",
          },
          {
            text: "Death in Custody - Clinical Negligence",
            value: "MN036",
          },
          {
            text: "Mental Health",
            value: "MH028",
          },
          {
            text: "Death in Detention - Mental Health",
            value: "MH030",
          },
          {
            text: "Death in Custody",
            value: "IQ001",
          },
          {
            text: "Inquest",
            value: "IQ002",
          },
          {
            text: "Schedule 6 Town & Country Planning Act 1990",
            value: "IQ003",
          },
          {
            text: "Public Inquiry s1 Inquiries Act 2005",
            value: "IQ004",
          },
          {
            text: "S13 Coroner’s Act 1988 - Public Law",
            value: "IQ010",
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
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      const expectedSelectedProceeding = {
        proceedingId: "MN035",
        proceedingDescription: "Clinical Negligence",
        matterType: "INQUEST",
      };

      requestStub.body = {
        "proceeding-option": "MN035",
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
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

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
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      const selectedProceedings = [
        {
          proceedingId: "MN035",
          proceedingDescription: "Clinical Negligence",
          matterType: "INQUEST",
        },
      ];

      requestStub.session.selectedProceedings = selectedProceedings;

      const expectedFormattedProceedings = [
        {
          key: { text: "MN035" },
          value: { text: "Clinical Negligence" },
          actions: {
            items: [
              {
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
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

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
    it("redirects to deceased details page if no selected", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.body = {
        _csrf: "abcdefg",
        "add-another-proceeding": "false",
      };

      proceedingsAdaptor.processProceedingsConfirmation(
        requestStub,
        responseStub,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert(redirectArgs[0], "/apply/deceased-details/name");
    });
    it("redirects to form page if yes selected", () => {
      const formValidator = new ProceedingsValidator();
      const formatter = new Formatter()
      const proceedingsAdaptor = new ProceedingsAdaptor(formValidator, formatter);

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
