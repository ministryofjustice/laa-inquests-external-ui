import { assert } from "chai";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ProceedingsAdaptor } from "#src/adaptors/presenters/apply/Proceeding/Proceedings.adaptor.js";
import { ProceedingValidator } from "#src/adaptors/presenters/apply/Proceeding/Proceeding.validator.js";
import { Formatter } from "#src/utils/Formatter.js";

describe("Proceedings adaptor", () => {
  describe("renderProceedingSelectForm", () => {
    it("renders proceeding selection form", () => {
      const formValidator = new ProceedingValidator();
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
            text: "IQPC - Death in police custody",
            value: "IQPC",
          },
          {
            text: "IQPO - Death in prison",
            value: "IQPO",
          },
          {
            text: "IQMT - Death during medical treatment",
            value: "IQMT",
          },
          {
            text: "IQMH - Death in mental health detention",
            value: "IQMH",
          },
          {
            text: "IQMC - Death relating to mental health care in the community",
            value: "IQMC",
          },
          {
            text: "IQCC - Death relating to other care in the community",
            value: "IQCC",
          },
          {
            text: "IQHO - Death relating to issues with condition/safety of housing",
            value: "IQHO",
          },
          {
            text: "IQCA - Death relating to a child’s care arrangements",
            value: "IQCA",
          },
          {
            text: "IQDV - Death relating to failure to prevent domestic violence",
            value: "IQDV",
          },
          {
            text: "IQED - Death relating to issues in an educational setting",
            value: "IQED",
          },
          {
            text: "IQTR - Death relating to issues relating to transport",
            value: "IQTR",
          },
          {
            text: "IQOT - Other",
            value: "IQOT",
          },
        ],
        proceedingOption: "",
      };
      proceedingsAdaptor.renderProceedingSelectForm(requestStub, responseStub);
      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert(renderArgs[0], "apply/proceeding/add-proceedings");
      assert.deepInclude(renderArgs[1], expectedRenderOptions);
    });

    it("renders proceeding selection form with pre-selected option from session", () => {
      const formValidator = new ProceedingValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      requestStub.session.proceedingOption = {
        proceedingId: "IQPC",
        proceedingName: "Death in police custody",
        matterType: "INQUEST",
      };

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      proceedingsAdaptor.renderProceedingSelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/proceeding/add-proceedings");

      assert.propertyVal(renderArgs[1], "proceedingOption", "IQPC");
      assert.propertyVal(renderArgs[1], "csrfToken", "abcdefg");
    });

    it("renders proceeding selection form with empty string when no session data", () => {
      const formValidator = new ProceedingValidator();
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

      proceedingsAdaptor.renderProceedingSelectForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;

      assert.propertyVal(renderArgs[1], "proceedingOption", "");
    });

    it("captures check-your-answers origin and sets backHref to check-your-answers", () => {
      const formValidator = new ProceedingValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.query = { from: "check-your-answers" };

      responseStub.locals = {
        csrfToken: "abcdefg",
      };

      proceedingsAdaptor.renderProceedingSelectForm(requestStub, responseStub);

      assert.equal(requestStub.session.returnToApplyCheckYourAnswers, true);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.propertyVal(
        renderArgs[1],
        "backHref",
        "/apply/check-your-answers",
      );
    });
  });
  describe("processProceedingsForm", () => {
    it("adds selected proceedings to the session object", () => {
      const formValidator = new ProceedingValidator();
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
      assert.deepEqual(
        requestStub.session.selectedProceeding,
        expectedSelectedProceeding,
      );
      assert.deepEqual(
        requestStub.session.proceedingOption,
        expectedSelectedProceeding,
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(
        redirectArgs[0] as unknown as string,
        "/apply/deceased-details/name",
      );
    });
    it("renders error message if no proceeding option is selected", async () => {
      const formValidator = new ProceedingValidator();
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
      assert.deepEqual(requestStub.session.selectedProceeding, undefined);
      assert.deepEqual(requestStub.session.proceedingOption, undefined);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "apply/proceeding/add-proceedings");

      assert.deepInclude(renderArgs[1], {
        errorSummaries: {
          noProceedingSelected: {
            text: "Select what your client wants legal aid for",
          },
        },
      });

      // Should also pass proceedingOption as empty string when no session data
      assert.propertyVal(renderArgs[1], "proceedingOption", "");
    });

    it("redirects back to check-your-answers when return flag is set", () => {
      const formValidator = new ProceedingValidator();
      const formatter = new Formatter();
      const proceedingsAdaptor = new ProceedingsAdaptor(
        formValidator,
        formatter,
      );

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      requestStub.session.returnToApplyCheckYourAnswers = true;
      requestStub.body = {
        "proceeding-option": "IQPC",
      };

      proceedingsAdaptor.processProceedingsForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      assert.equal(
        String(responseStub.redirect.getCall(0).args[0]),
        "/apply/check-your-answers",
      );
      assert.equal(
        requestStub.session.returnToApplyCheckYourAnswers,
        undefined,
      );
    });
  });
});
