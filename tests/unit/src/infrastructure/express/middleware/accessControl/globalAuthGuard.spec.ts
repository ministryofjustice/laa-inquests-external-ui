import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { globalAuthGuard } from "#src/infrastructure/express/middleware/accessControl/globalAuthGuard.js";
import { initializeI18nextSync } from "#src/infrastructure/express/middleware/nunjucks/i18nLoader.js";

describe("globalAuthGuard", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  before(() => {
    initializeI18nextSync();
  });

  beforeEach(() => {
    req = stubInterface<Request>();
    res = stubInterface<Response>();
    next = sinon.stub();
    req.session = {} as any;
  });

  afterEach(() => {
    sinon.restore();
  });

  const setPath = (path: string): void => {
    (req as unknown as { path: string }).path = path;
  };

  const setMethod = (method: string): void => {
    (req as unknown as { method: string }).method = method;
  };

  describe("public paths (no auth required)", () => {
    it("allows unauthenticated access to /health", () => {
      setPath("/health");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });

    it("allows unauthenticated access to /status", () => {
      setPath("/status");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });

    it("redirects unauthenticated users to /auth/login for /error", () => {
      setPath("/error");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects unauthenticated users to /auth/login for /accessibility-statement", () => {
      setPath("/accessibility-statement");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects unauthenticated users to /auth/login for /cookies", () => {
      setPath("/cookies");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("allows unauthenticated access to /auth/login", () => {
      setPath("/auth/login");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });

    it("allows unauthenticated access to /auth/callback", () => {
      setPath("/auth/callback");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });

    it("allows unauthenticated access to /auth/* paths", () => {
      setPath("/auth/logout");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });
  });

  describe("protected paths (auth required)", () => {
    it("redirects unauthenticated users to /auth/login", () => {
      setPath("/apply");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects for unknown routes (unauthenticated)", () => {
      setPath("/unknown-path");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects for deeply nested unknown routes (unauthenticated)", () => {
      setPath("/some/deep/unknown/route");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects for /apply route (unauthenticated)", () => {
      setPath("/apply");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects for /claim route (unauthenticated)", () => {
      setPath("/claim");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("redirects for /help route (unauthenticated)", () => {
      setPath("/help");
      setMethod("GET");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });
  });

  describe("authenticated users", () => {
    beforeEach(() => {
      req.session.userId = "test-user";
    });

    it("allows authenticated users to protected routes (delegates to route handler)", () => {
      setPath("/apply");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });

    it("allows authenticated users to unknown routes (lets 404 handler decide)", () => {
      setPath("/unknown-route");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });

    it("allows authenticated users to public routes", () => {
      setPath("/health");
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });
  });

  describe("edge cases", () => {
    it("handles requests with no userId (treats as unauthenticated)", () => {
      setPath("/apply");
      req.session.userId = undefined;
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });

    it("handles requests with no session (treats as unauthenticated)", () => {
      setPath("/apply");
      req.session = {} as any;
      globalAuthGuard(req, res, next as NextFunction);
      assert.equal(next.callCount, 0);
      assert.equal(res.redirect.callCount, 1);
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
    });
  });
});
