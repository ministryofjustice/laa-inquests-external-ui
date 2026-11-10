import { strict as assert } from "assert";
import { StubbedInstance, stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import {
  completeStepAndRedirect,
  JOURNEY_NOT_STARTED,
} from "#src/adaptors/presenters/utils/journeyStepHelper.js";

describe("journeyStepHelper", () => {
  describe("JOURNEY_NOT_STARTED constant", () => {
    it("is defined as -1", () => {
      assert.equal(JOURNEY_NOT_STARTED, -1);
    });
  });

  describe("completeStepAndRedirect", () => {
    let requestStub: StubbedInstance<Request>;
    let responseStub: StubbedInstance<Response>;

    beforeEach(() => {
      requestStub = stubInterface<Request>();
      responseStub = stubInterface<Response>();
      requestStub.session = {} as any;
    });

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

    it("marks a valid journey step as complete", () => {
      completeStepAndRedirect(
        requestStub,
        responseStub,
        "/apply/client-details/name-and-dob",
      );

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 1);
    });

    it("records the correct index for each journey step", () => {
      completeStepAndRedirect(
        requestStub,
        responseStub,
        "/apply/client-details/nino",
      );

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 2);
    });

    it("ignores invalid URLs not in the journey sequence", () => {
      requestStub.session = { existingData: "test" } as any;

      completeStepAndRedirect(requestStub, responseStub, "/invalid/path");

      assert.deepEqual(requestStub.session as any, { existingData: "test" });
    });

    it("updates existing apply session state without losing other fields", () => {
      requestStub.session = {
        apply: {
          clientFirstName: "John",
          clientLastName: "Doe",
        },
      } as any;

      completeStepAndRedirect(
        requestStub,
        responseStub,
        "/apply/client-details/name-and-dob",
      );

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

      completeStepAndRedirect(
        requestStub,
        responseStub,
        "/apply/client-details/has-prev-application",
      );

      const applyState = (requestStub.session as any).apply;
      assert.equal(applyState.lastCompletedStepIndex, 3);
    });
  });
});
