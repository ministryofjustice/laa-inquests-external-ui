import { strict as assert } from "assert";
import { stubInterface } from "ts-sinon";
import type { Request } from "express";
import {
  markStepComplete,
  JOURNEY_NOT_STARTED,
} from "#src/adaptors/presenters/utils/journeyStepHelper.js";

describe("journeyStepHelper", () => {
  describe("JOURNEY_NOT_STARTED constant", () => {
    it("is defined as -1", () => {
      assert.equal(JOURNEY_NOT_STARTED, -1);
    });
  });

  describe("markStepComplete", () => {
    it("marks a valid journey step as complete", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {} as any;

      markStepComplete(requestStub, "/apply/office-accounts");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });

    it("records the correct index for each journey step", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {} as any;

      markStepComplete(requestStub, "/apply/client-details/name-and-dob");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 2);
    });

    it("ignores invalid URLs not in the journey sequence", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = { existingData: "test" } as any;

      markStepComplete(requestStub, "/invalid/path");

      assert.deepEqual(requestStub.session as any, { existingData: "test" });
    });

    it("updates existing apply session state without losing other fields", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {
        apply: {
          clientFirstName: "John",
          clientLastName: "Doe",
        },
      } as any;

      markStepComplete(requestStub, "/apply/office-accounts");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.clientFirstName, "John");
      assert.equal(applyState.clientLastName, "Doe");
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });

    it("advances existing lastCompletedStepIndex", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {
        apply: {
          lastCompletedStepIndex: 2,
        },
      } as any;

      markStepComplete(requestStub, "/apply/client-details/nino");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 3);
    });

    it("marks a Claim journey step in the Claim session", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {} as any;

      markStepComplete(requestStub, "/claim/search", "claim");

      const claimState = (requestStub.session as any).claim;
      assert.equal(claimState.lastCompletedStepIndex, 1);
    });

    it("advances through pages skipped by a Claim branch", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {} as any;

      markStepComplete(requestStub, "/claim/type", "claim", "/claim/subtype");

      const claimState = (requestStub.session as any).claim;
      assert.equal(claimState.lastCompletedStepIndex, 4);
    });

    it("rewinds Claim progress when an earlier step is edited", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {
        claim: { lastCompletedStepIndex: 18 },
      } as any;

      markStepComplete(requestStub, "/claim/type", "claim");

      const claimState = (requestStub.session as any).claim;
      assert.equal(claimState.lastCompletedStepIndex, 3);
    });

    it("marks the final step as complete", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {} as any;

      markStepComplete(requestStub, "/apply/confirmation/success");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 20);
    });
  });
});
