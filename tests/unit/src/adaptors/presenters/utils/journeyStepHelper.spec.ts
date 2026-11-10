import { strict as assert } from "assert";
import { StubbedInstance, stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import {
  completeStepAndRedirect,
  markStepComplete,
} from "#src/adaptors/presenters/utils/journeyStepHelper.js";

describe("journeyStepHelper", () => {
  let responseStub: StubbedInstance<Response>;
  let requestStub: StubbedInstance<Request>;

  beforeEach(() => {
    requestStub = stubInterface<Request>();
    responseStub = stubInterface<Response>();
    requestStub.session = {} as any;
  });

  describe("completeStepAndRedirect", () => {
    it("redirects to redirect url", () => {
      completeStepAndRedirect(
        requestStub,
        responseStub,
        "/apply/client-details/name-and-dob",
      );
      assert.equal(responseStub.redirect.callCount, 1);
      const redirectArgs = responseStub.redirect.getCall(0).args;
      assert.equal(redirectArgs[0], "/apply/client-details/name-and-dob");
    });

    it("marks the previous step complete before redirecting", () => {
      completeStepAndRedirect(
        requestStub,
        responseStub,
        "/apply/client-details/name-and-dob",
      );

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });
  });

  describe("markStepComplete", () => {
    it("marks a valid journey step as complete", () => {
      markStepComplete(requestStub, "/apply/office-accounts");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });

    it("records the correct index for each journey step", () => {
      markStepComplete(requestStub, "/apply/client-details/name-and-dob");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 2);
    });

    it("ignores invalid URLs not in the journey sequence", () => {
      requestStub.session = { existingData: "test" } as any;

      markStepComplete(requestStub, "/invalid/path");
    });

    it("updates existing apply session state without losing other fields", () => {
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
      requestStub.session = {
        apply: {
          lastCompletedStepIndex: 2,
        },
      } as any;

      markStepComplete(requestStub, "/apply/client-details/nino");

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 3);
    });
  });
});
