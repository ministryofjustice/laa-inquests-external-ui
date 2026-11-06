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

    it("overwrites existing lastCompletedStepIndex", () => {
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

    it("marks the final step as complete", () => {
      const requestStub = stubInterface<Request>();
      requestStub.session = {} as any;

      markStepComplete(requestStub, "/apply/confirmation/success");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 20);
    });
  });
});
