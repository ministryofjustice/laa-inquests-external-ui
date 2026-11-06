import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request } from "express";
import {
  markStepComplete,
  markClaimStepComplete,
  JOURNEY_NOT_STARTED,
} from "#src/adaptors/presenters/utils/journeyStepHelper.js";
import { CLAIM_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";

describe("journeyStepHelper", () => {
  describe("markClaimStepComplete", () => {
    it("records skipped final bill steps when continuing from total cost to evidence", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = { type: "PAYMENT_ON_ACCOUNT" };

      markClaimStepComplete(
        requestStub,
        "/claim/total-cost",
        "/claim/evidence",
      );

      assert.equal(
        requestStub.session.claim?.lastCompletedStepIndex,
        CLAIM_JOURNEY_SEQUENCE.indexOf("/claim/evidence") - 1,
      );
      assert.equal(requestStub.session.claim?.type, "PAYMENT_ON_ACCOUNT");
    });

    it("requires recovery costs again after changing the recovery answer", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = {
        lastCompletedStepIndex: CLAIM_JOURNEY_SEQUENCE.indexOf(
          "/claim/check-your-answers",
        ),
      };

      markClaimStepComplete(
        requestStub,
        "/claim/inquest-outcome-recovery",
        "/claim/recovery-costs",
      );

      assert.equal(
        requestStub.session.claim?.lastCompletedStepIndex,
        CLAIM_JOURNEY_SEQUENCE.indexOf("/claim/inquest-outcome-recovery"),
      );
    });

    it("does not record progress for an unknown claim step", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = { lastCompletedStepIndex: 0 };

      markClaimStepComplete(requestStub, "/claim/unknown", "/claim/search");

      assert.equal(requestStub.session.claim?.lastCompletedStepIndex, 0);
    });
  });

  describe("JOURNEY_NOT_STARTED constant", () => {
    it("is defined as -1", () => {
      assert.equal(JOURNEY_NOT_STARTED, -1);
    });
  });

  describe("markStepComplete", () => {
    it("records claim progress without losing claim data or changing apply progress", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session.claim = { type: "POA" };
      requestStub.session.apply = { lastCompletedStepIndex: 2 };

      markStepComplete(requestStub, "/claim/search", {
        journeyType: "claim",
        journeySequence: ["/claim", "/claim/search"],
      });

      assert.deepEqual(requestStub.session.claim, {
        type: "POA",
        lastCompletedStepIndex: 1,
      });
      assert.deepEqual(requestStub.session.apply, {
        lastCompletedStepIndex: 2,
      });
    });

    it("marks a valid journey step as complete", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {};

      markStepComplete(requestStub, "/apply/office-accounts");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });

    it("records the correct index for each journey step", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {};

      markStepComplete(requestStub, "/apply/client-details/name-and-dob");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 2);
    });

    it("ignores invalid URLs not in the journey sequence", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = { existingData: "test" };

      markStepComplete(requestStub, "/invalid/path");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      assert.deepEqual(requestStub.session as any, { existingData: "test" });
    });

    it("updates existing apply session state without losing other fields", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {
        apply: {
          clientFirstName: "John",
          clientLastName: "Doe",
        },
      };

      markStepComplete(requestStub, "/apply/office-accounts");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.clientFirstName, "John");
      assert.equal(applyState.clientLastName, "Doe");
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });

    it("overwrites existing lastCompletedStepIndex", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {
        apply: {
          lastCompletedStepIndex: 2,
        },
      };

      markStepComplete(requestStub, "/apply/client-details/nino");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 3);
    });

    it("handles undefined initial session gracefully", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = undefined as never;

      // Should not throw
      markStepComplete(requestStub, "/apply/office-accounts");
    });

    it("marks the final step as complete", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {};

      markStepComplete(requestStub, "/apply/confirmation/success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 20);
    });
  });
});
