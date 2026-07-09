import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { ClaimTypeAdaptor } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.adaptor.js";
import { ClaimTypeValidator } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.validator.js";
import { CLAIM_TYPE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("ClaimType adaptor", () => {
  const selectedClient = {
    reference: "ABC-12345",
    clientName: "Jane Smith",
    clientFirstName: "Jane",
    clientLastName: "Smith",
    dateOfBirth: "01/01/2000",
  };

  describe("renderForm", () => {
    it("redirects to /claim when no case has been selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("renders the claim type form with the session selection", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "NIL_BILL",
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-type");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.claimType, "NIL_BILL");
    });

    it("resets completed journey flags when entering the claim type page", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
        totalCostCompleted: true,
        evidenceCompleted: true,
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.typeCompleted, false);
      assert.equal(requestStub.session.claim?.totalCostCompleted, false);
      assert.equal(requestStub.session.claim?.evidenceCompleted, false);
    });

    it("keeps claim subtype value when entering the claim type page", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.renderForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, "EXPERT_COST");
      assert.equal(requestStub.session.claim?.subtypeCompleted, false);
    });
  });

  describe("processForm", () => {
    it("re-renders the form with an error when no claim type is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = {};

      adaptor.processForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-type");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          claimTypeInputError: {
            text: CLAIM_TYPE_ERROR.MISSING_CLAIM_TYPE,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves the claim type to session and redirects to /claim/subtype when Payment on account is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "PAYMENT_ON_ACCOUNT" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "PAYMENT_ON_ACCOUNT");
      assert.equal(requestStub.session.claim?.typeCompleted, true);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/subtype");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("saves the claim type to session and skips to /claim/total-cost when a non-POA type is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.type, "FINAL_BILL");
      assert.equal(requestStub.session.claim?.typeCompleted, true);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/total-cost");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("clears the subtype from the session when a non-POA type is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, undefined);
    });

    it("does not clear the subtype from the session when POA is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "PAYMENT_ON_ACCOUNT" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, "EXPERT_COST");
      assert.equal(requestStub.session.claim?.subtypeCompleted, false);
    });

    it("resets completed journey flags when the claim type changes", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-type": "FINAL_BILL" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
        totalCostCompleted: true,
        evidenceCompleted: true,
      };

      adaptor.processForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.totalCostCompleted, false);
      assert.equal(requestStub.session.claim?.evidenceCompleted, false);
    });
  });

  describe("renderSubtypeForm", () => {
    it("redirects to /claim when no case has been selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("redirects to /claim/type when type is incomplete", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();
      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "",
        typeCompleted: false,
      };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/type");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("renders the claim subtype form with the session selection", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "PAYMENT_ON_ACCOUNT",
        typeCompleted: true,
        subtype: "EXPERT_COST",
      };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-subtype");
      const viewModel = renderArgs[1] as unknown as Record<string, unknown>;
      assert.equal(viewModel.csrfToken, "test-token");
      assert.equal(viewModel.claimSubtype, "EXPERT_COST");
    });

    it("resets completed journey flags when entering the claim subtype page", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.session.claim = {
        caseReference: "ABC-12345",
        client: selectedClient,
        type: "PAYMENT_ON_ACCOUNT",
        typeCompleted: true,
        subtype: "EXPERT_COST",
        totalCostCompleted: true,
        evidenceCompleted: true,
      };

      adaptor.renderSubtypeForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.totalCostCompleted, false);
      assert.equal(requestStub.session.claim?.evidenceCompleted, false);
    });
  });

  describe("processSubtypeForm", () => {
    it("re-renders the form with an error when no claim subtype is selected", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = {};

      adaptor.processSubtypeForm(requestStub, responseStub);

      assert.equal(responseStub.render.callCount, 1);
      const renderArgs = responseStub.render.getCall(0).args;
      assert.equal(renderArgs[0], "claim/claim-subtype");
      assert.deepEqual(
        (renderArgs[1] as unknown as Record<string, unknown>).errorSummaries,
        {
          claimSubtypeInputError: {
            text: CLAIM_TYPE_ERROR.MISSING_CLAIM_SUBTYPE,
          },
        },
      );
      assert.equal(responseStub.redirect.callCount, 0);
    });

    it("saves the claim subtype to session and redirects to /claim/total-cost when valid", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-subtype": "PROFIT_COST" };

      adaptor.processSubtypeForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.subtype, "PROFIT_COST");
      assert.equal(requestStub.session.claim?.subtypeCompleted, true);
      assert.equal(responseStub.redirect.callCount, 1);
      const [redirectUrl] = responseStub.redirect.getCall(0).args;
      assert.equal(redirectUrl, "/claim/total-cost");
      assert.equal(responseStub.render.callCount, 0);
    });

    it("resets completed journey flags when the claim subtype changes", () => {
      const adaptor = new ClaimTypeAdaptor(new ClaimTypeValidator());

      const responseStub = stubInterface<Response>();
      const requestStub = stubInterface<Request>();

      responseStub.locals = { csrfToken: "test-token" };
      requestStub.body = { "claim-subtype": "PROFIT_COST" };
      requestStub.session.claim = {
        type: "PAYMENT_ON_ACCOUNT",
        subtype: "EXPERT_COST",
        totalCostCompleted: true,
        evidenceCompleted: true,
      };

      adaptor.processSubtypeForm(requestStub, responseStub);

      assert.equal(requestStub.session.claim?.totalCostCompleted, false);
      assert.equal(requestStub.session.claim?.evidenceCompleted, false);
    });
  });
});
