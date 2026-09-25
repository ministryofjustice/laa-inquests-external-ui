import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { globalAccessGuard } from "#src/infrastructure/express/middleware/accessControl/globalAccessGuard.js";
import {
  APP_ROLES,
  RECOGNISED_ROLES,
  ROUTE_POLICIES,
  type RoutePolicy,
} from "#src/infrastructure/config/accessControl.js";
import { HTTP_FORBIDDEN } from "#src/infrastructure/locales/constants.js";
import { initializeI18nextSync } from "#src/infrastructure/express/middleware/nunjucks/i18nLoader.js";

describe("globalAccessGuard", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  before(() => {
    initializeI18nextSync();
  });

  beforeEach(() => {
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    res.status.returns(res);
    next = sinon.stub();
    req.session = {} as any;
  });

  afterEach(() => {
    sinon.restore();
  });

  const setPath = (path: string): void => {
    (req as unknown as { path: string }).path = path;
  };

  const testPolicyProtectedRoute = (
    description: string,
    path: string,
    allowedRoles: string[],
  ) => {
    describe(description, () => {
      beforeEach(() => {
        setPath(path);
        req.session.userId = "test-caseworker";
      });

      it("denies access when no session role satisfies the policy", () => {
        const deniedRoles = RECOGNISED_ROLES.filter(
          (r) => !allowedRoles.includes(r),
        );

        for (const role of deniedRoles) {
          req.session.roles = [role];

          globalAccessGuard(req, res, next as NextFunction);

          assert.equal(next.callCount, 0);
          assert.equal(res.status.callCount, 1);
          assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
          assert.deepEqual(res.render.firstCall.args, [
            "main/error-unauthorised",
          ]);
          next.resetHistory();
          res.status.resetHistory();
          res.render.resetHistory();
        }
      });

      it("allows access when a session role satisfies the policy", () => {
        for (const role of allowedRoles) {
          req.session.roles = [role];

          globalAccessGuard(req, res, next as NextFunction);

          assert.equal(next.callCount, 1);
          assert.equal(res.status.callCount, 0);

          next.resetHistory();
          res.status.resetHistory();
        }
      });
    });
  };

  describe("Public paths", () => {
    for (const path of [
      "/health",
      "/status",
      "/auth/login",
      "/auth/callback",
    ]) {
      it(`allows unauthenticated access to ${path}`, () => {
        setPath(path);

        globalAccessGuard(req, res, next as NextFunction);

        assert.equal(next.callCount, 1);
        assert.equal(res.status.callCount, 0);
      });
    }
  });

  describe("Unauthenticated requests to non-public paths", () => {
    it("calls next() and defers to requireAuth", () => {
      setPath("/apply");

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
    });

    it("is safe when session roles are missing", () => {
      setPath("/apply");
      req.session.userId = undefined;

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 1);
    });
  });

  describe("Authenticated requests", () => {
    beforeEach(() => {
      req.session.userId = "test-caseworker";
    });

    it("denies access when no route policy is configured", () => {
      setPath("/unknown");

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
    });

    it("is safe when session roles are missing", () => {
      setPath("/apply");

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 0);
    });

    it("allows access when a role satisfies the route policy", () => {
      setPath("/apply");
      req.session.roles = [APP_ROLES.APPLICATION_USER];

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
    });
  });

  describe("Only authenticated requests to a policy-protected dummy test route", () => {
    // Allows adding a test policy to the otherwise readonly ROUTE_POLICIES array.
    const mutableRoutePolicies = ROUTE_POLICIES as RoutePolicy[];
    const testPolicy: RoutePolicy = {
      prefix: "/test-route",
      allowedRoles: [APP_ROLES.APPLICATION_USER],
    };

    beforeEach(() => {
      setPath("/test-route");
      req.session.userId = "test-caseworker";
      mutableRoutePolicies.push(testPolicy);
    });

    afterEach(() => {
      mutableRoutePolicies.pop();
    });

    it("denies access when no session role satisfies the policy", () => {
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
      assert.deepEqual(res.render.firstCall.args, ["main/error-unauthorised"]);
    });

    it("allows access when a session role satisfies the policy", () => {
      req.session.roles = [APP_ROLES.APPLICATION_USER];

      globalAccessGuard(req, res, next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
    });
  });

  describe("Parameterized tests for policy-protected routes", () => {
    const policyTests = [
      {
        description: "Only authenticated requests to apply routes",
        path: "/apply/client-details",
        allowedRoles: [APP_ROLES.APPLICATION_USER],
      },
      {
        description: "Only authenticated requests to claim routes",
        path: "/claim/client-details",
        allowedRoles: [APP_ROLES.CLAIMS_USER],
      },
    ];

    for (const test of policyTests) {
      testPolicyProtectedRoute(test.description, test.path, test.allowedRoles);
    }
  });
});
