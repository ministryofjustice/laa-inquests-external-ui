import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { createJourneyGuard } from "#src/infrastructure/express/middleware/accessControl/journeyGuard.js";
import { JOURNEY_NOT_STARTED } from "#src/adaptors/presenters/utils/journeyStepHelper.js";

const TEST_JOURNEY_SEQUENCE = [
  "/apply/step-1",
  "/apply/step-2",
  "/apply/step-3",
  "/apply/step-4",
  "/apply/confirmation",
] as const;

describe("journeyGuard middleware", () => {
  let requestStub: Request;
  let responseStub: Response;
  let nextSpy: sinon.SinonSpy;

  beforeEach(() => {
    requestStub = stubInterface<Request>();
    responseStub = stubInterface<Response>();
    nextSpy = sinon.spy();

    // Mock session with apply property
    requestStub.session = {} as any;
    (requestStub as any).path = "/apply/step-1";

    // Setup redirect spy
    responseStub.redirect = sinon.spy();
  });

  describe("createJourneyGuard factory", () => {
    it("creates a middleware function", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      assert(typeof middleware === "function");
    });

    it("creates independent middleware instances", () => {
      const middleware1 = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      const middleware2 = createJourneyGuard({
        journeyType: "claim",
        journeyPrefix: "/claim",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      assert.notStrictEqual(middleware1, middleware2);
    });
  });

  describe("step access control", () => {
    it("allows access to the first step", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      (requestStub as any).path = "/apply/step-1";

      middleware(requestStub, responseStub, nextSpy);

      assert(nextSpy.calledOnce);
    });

    it("allows access to step immediately after last completed step", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed step 1 (index 0), trying to access step 2 (index 1)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 0 },
      } as any;
      (requestStub as any).path = "/apply/step-2";

      middleware(requestStub, responseStub, nextSpy);

      assert(nextSpy.calledOnce);
    });

    it("allows access to already-completed steps", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed step 3 (index 2), accessing step 2 (index 1)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 2 },
      } as any;
      (requestStub as any).path = "/apply/step-2";

      middleware(requestStub, responseStub, nextSpy);

      assert(nextSpy.calledOnce);
    });

    it("redirects when attempting to skip one step", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed step 1 (index 0), trying to skip to step 3 (index 2)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 0 },
      } as any;
      (requestStub as any).path = "/apply/step-3";

      middleware(requestStub, responseStub, nextSpy);

      assert(!nextSpy.called);
      assert((responseStub.redirect as any).calledOnce);
      // Redirect to last completed step
      assert.strictEqual(
        (responseStub.redirect as any).firstCall.args[0],
        "/apply/step-1",
      );
    });

    it("redirects when attempting to skip multiple steps", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed step 1 (index 0), trying to skip to confirmation (index 4)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 0 },
      } as any;
      (requestStub as any).path = "/apply/confirmation";

      middleware(requestStub, responseStub, nextSpy);

      assert(!nextSpy.called);
      assert((responseStub.redirect as any).calledOnce);
      assert.strictEqual(
        (responseStub.redirect as any).firstCall.args[0],
        "/apply/step-1",
      );
    });
  });

  describe("session state handling", () => {
    it("treats missing lastCompletedStepIndex as JOURNEY_NOT_STARTED", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // Session has no lastCompletedStepIndex
      requestStub.session = { apply: {} } as any;
      (requestStub as any).path = "/apply/step-1";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access to first step
      assert(nextSpy.calledOnce);
    });

    it("treats missing apply state as JOURNEY_NOT_STARTED", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // Session has no apply property at all
      requestStub.session = {} as any;
      (requestStub as any).path = "/apply/step-1";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access to first step
      assert(nextSpy.calledOnce);
    });

    it("treats non-numeric lastCompletedStepIndex as JOURNEY_NOT_STARTED", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // Session has invalid lastCompletedStepIndex
      requestStub.session = {
        apply: { lastCompletedStepIndex: "invalid" },
      } as any;
      (requestStub as any).path = "/apply/step-1";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access to first step
      assert(nextSpy.calledOnce);
    });

    it("allows access to next step after completing a later step in sequence", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed step 4 (index 3), now trying step 3 (index 2)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 3 },
      } as any;
      (requestStub as any).path = "/apply/step-3";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access (going back to an earlier step)
      assert(nextSpy.calledOnce);
    });
  });

  describe("path handling", () => {
    it("allows access to paths not in the journey sequence", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      (requestStub as any).path = "/apply/some-utility-endpoint";

      middleware(requestStub, responseStub, nextSpy);

      // Should bypass the guard
      assert(nextSpy.calledOnce);
    });

    it("correctly handles journey prefix in path matching", () => {
      const middleware = createJourneyGuard({
        journeyType: "claim",
        journeyPrefix: "/claim",
        journeySequence: ["/claim/step-1", "/claim/step-2"] as const,
      });

      requestStub.session = { claim: {} } as any;
      (requestStub as any).path = "/claim/step-1";

      middleware(requestStub, responseStub, nextSpy);

      assert(nextSpy.calledOnce);
    });

    it("handles paths with trailing slashes", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      requestStub.session = { apply: {} } as any;
      // Path has trailing slash but not in sequence
      (requestStub as any).path = "/apply/step-1/";

      middleware(requestStub, responseStub, nextSpy);

      // Should not match and bypass the guard
      assert(nextSpy.calledOnce);
    });
  });

  describe("journey type isolation", () => {
    it("uses correct session property for apply journey", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // Session has claim state but not apply state
      requestStub.session = {
        claim: { lastCompletedStepIndex: 3 },
        apply: {},
      } as any;
      (requestStub as any).path = "/apply/step-1";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access (using apply state, not claim state)
      assert(nextSpy.calledOnce);
    });

    it("uses correct session property for claim journey", () => {
      const middleware = createJourneyGuard({
        journeyType: "claim",
        journeyPrefix: "/claim",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // Session has apply state but not claim state
      requestStub.session = {
        apply: { lastCompletedStepIndex: 3 },
        claim: {},
      } as any;
      (requestStub as any).path = "/claim/step-1";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access (using claim state, not apply state)
      assert(nextSpy.calledOnce);
    });

    it("redirects within the same journey", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User trying to skip in apply journey
      requestStub.session = {
        apply: { lastCompletedStepIndex: 0 },
      } as any;
      (requestStub as any).path = "/apply/step-3";

      middleware(requestStub, responseStub, nextSpy);

      // Redirect should use apply journey's step 1
      assert((responseStub.redirect as any).calledOnce);
      assert.strictEqual(
        (responseStub.redirect as any).firstCall.args[0],
        "/apply/step-1",
      );
    });
  });

  describe("boundary conditions", () => {
    it("allows access to final step after completing penultimate step", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed step 4 (index 3), trying to access confirmation (index 4)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 3 },
      } as any;
      (requestStub as any).path = "/apply/confirmation";

      middleware(requestStub, responseStub, nextSpy);

      assert(nextSpy.calledOnce);
    });

    it("allows access to final step", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // User completed confirmation step (index 4)
      requestStub.session = {
        apply: { lastCompletedStepIndex: 4 },
      } as any;
      (requestStub as any).path = "/apply/confirmation";

      middleware(requestStub, responseStub, nextSpy);

      assert(nextSpy.calledOnce);
    });

    it("redirects to first step when lastCompletedStepIndex is out of bounds", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // lastCompletedStepIndex beyond sequence length
      requestStub.session = {
        apply: { lastCompletedStepIndex: 999 },
      } as any;
      (requestStub as any).path = "/apply/step-3";

      middleware(requestStub, responseStub, nextSpy);

      // Should redirect to first step when index is out of bounds
      assert((responseStub.redirect as any).calledOnce);
      assert.strictEqual(
        (responseStub.redirect as any).firstCall.args[0],
        "/apply/step-1",
      );
    });

    it("redirects to first step when lastCompletedStepIndex is negative", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // lastCompletedStepIndex is negative
      requestStub.session = {
        apply: { lastCompletedStepIndex: -999 },
      } as any;
      (requestStub as any).path = "/apply/step-2";

      middleware(requestStub, responseStub, nextSpy);

      // Should redirect to first step
      assert((responseStub.redirect as any).calledOnce);
      assert.strictEqual(
        (responseStub.redirect as any).firstCall.args[0],
        "/apply/step-1",
      );
    });
  });

  describe("JOURNEY_NOT_STARTED constant usage", () => {
    it("matches expected value", () => {
      assert.strictEqual(JOURNEY_NOT_STARTED, -1);
    });

    it("correctly represents no steps completed", () => {
      const middleware = createJourneyGuard({
        journeyType: "apply",
        journeyPrefix: "/apply",
        journeySequence: TEST_JOURNEY_SEQUENCE,
      });

      // Explicitly set lastCompletedStepIndex to JOURNEY_NOT_STARTED
      requestStub.session = {
        apply: { lastCompletedStepIndex: JOURNEY_NOT_STARTED },
      } as any;
      (requestStub as any).path = "/apply/step-1";

      middleware(requestStub, responseStub, nextSpy);

      // Should allow access to first step
      assert(nextSpy.calledOnce);
    });
  });
});
