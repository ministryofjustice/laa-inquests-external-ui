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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {};

      markStepComplete(requestStub, "/apply/office-accounts");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 0);
    });

    it("records the correct index for each journey step", () => {
      const requestStub = stubInterface<Request>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test stub
      (requestStub as any).session = {};

      markStepComplete(requestStub, "/apply/client-details/name-and-dob");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test verification
      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 1);
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
      assert.equal(applyState.lastCompletedStepIndex, 0);
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
      assert.equal(applyState.lastCompletedStepIndex, 2);
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
      assert.equal(applyState.lastCompletedStepIndex, 19);
    });
  });
});
