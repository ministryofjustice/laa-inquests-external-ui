import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request } from "express";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { CLAIM_CHECK_YOUR_ANSWERS_PATH } from "#src/infrastructure/locales/constants.js";

describe("ClaimNavigationHelper", () => {
  describe("captureCheckYourAnswersEntry", () => {
    it("sets the flag when entered from check your answers", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.query = { from: "check-your-answers" };

      helper.captureCheckYourAnswersEntry(req);

      assert.equal(req.session.claim?.returnToCheckYourAnswers, true);
    });

    it("does not set the flag when not entered from check your answers", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.query = {};

      helper.captureCheckYourAnswersEntry(req);

      assert.equal(req.session.claim?.returnToCheckYourAnswers, undefined);
    });

    it("preserves existing claim data when setting the flag", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.query = { from: "check-your-answers" };
      req.session.claim = { counselNumber: "2" };

      helper.captureCheckYourAnswersEntry(req);

      assert.equal(req.session.claim?.counselNumber, "2");
      assert.equal(req.session.claim?.returnToCheckYourAnswers, true);
    });

    it("resets the recovery cost made edit marker on a fresh direct entry", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.query = { from: "check-your-answers" };
      req.session.claim = { recoveryCostMadeEditInProgress: true };

      helper.captureCheckYourAnswersEntry(req);

      assert.equal(
        req.session.claim?.recoveryCostMadeEditInProgress,
        undefined,
      );
    });
  });

  describe("isReturningToCheckYourAnswers", () => {
    it("returns true when the flag is set", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = { returnToCheckYourAnswers: true };

      assert.equal(helper.isReturningToCheckYourAnswers(req), true);
    });

    it("returns false when the flag is not set", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();

      assert.equal(helper.isReturningToCheckYourAnswers(req), false);
    });
  });

  describe("resolveBackHref", () => {
    it("resolves to check your answers when returning", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = { returnToCheckYourAnswers: true };

      assert.equal(
        helper.resolveBackHref(req, "/claim/evidence"),
        CLAIM_CHECK_YOUR_ANSWERS_PATH,
      );
    });

    it("uses the default back href when not returning", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();

      assert.equal(
        helper.resolveBackHref(req, "/claim/evidence"),
        "/claim/evidence",
      );
    });
  });

  describe("clearReturnToCheckYourAnswersFlag", () => {
    it("clears the flag without dropping other claim data", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = {
        counselNumber: "2",
        returnToCheckYourAnswers: true,
      };

      helper.clearReturnToCheckYourAnswersFlag(req);

      assert.equal(req.session.claim?.returnToCheckYourAnswers, undefined);
      assert.equal(req.session.claim?.counselNumber, "2");
    });

    it("does nothing when there is no claim in the session", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();

      helper.clearReturnToCheckYourAnswersFlag(req);

      assert.equal(req.session.claim, undefined);
    });

    it("also clears the recovery cost made edit marker", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = {
        returnToCheckYourAnswers: true,
        recoveryCostMadeEditInProgress: true,
      };

      helper.clearReturnToCheckYourAnswersFlag(req);

      assert.equal(
        req.session.claim?.recoveryCostMadeEditInProgress,
        undefined,
      );
    });
  });

  describe("markRecoveryCostMadeEdit", () => {
    it("sets the recovery cost made edit marker without dropping other claim data", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = { returnToCheckYourAnswers: true };

      helper.markRecoveryCostMadeEdit(req);

      assert.equal(req.session.claim?.recoveryCostMadeEditInProgress, true);
      assert.equal(req.session.claim?.returnToCheckYourAnswers, true);
    });
  });

  describe("resolveCostPageBackHref", () => {
    it("returns the default (recovery cost made) href when reached via a recovery cost made edit", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = {
        returnToCheckYourAnswers: true,
        recoveryCostMadeEditInProgress: true,
      };

      assert.equal(
        helper.resolveCostPageBackHref(req, "/claim/inquest-outcome-recovery"),
        "/claim/inquest-outcome-recovery",
      );
    });

    it("returns check your answers when reached via a direct change to the cost page", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();
      req.session.claim = { returnToCheckYourAnswers: true };

      assert.equal(
        helper.resolveCostPageBackHref(req, "/claim/inquest-outcome-recovery"),
        CLAIM_CHECK_YOUR_ANSWERS_PATH,
      );
    });

    it("returns the default href in the normal forward journey", () => {
      const helper = new ClaimNavigationHelper();
      const req = stubInterface<Request>();

      assert.equal(
        helper.resolveCostPageBackHref(req, "/claim/inquest-outcome-recovery"),
        "/claim/inquest-outcome-recovery",
      );
    });
  });
});
