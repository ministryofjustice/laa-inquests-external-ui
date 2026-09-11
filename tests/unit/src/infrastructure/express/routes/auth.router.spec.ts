import { strict as assert } from "assert";
import sinon from "sinon";
import express from "express";
import { stubInterface } from "ts-sinon";
import type { Request, Response } from "express";
import { createAuthRouter } from "#src/infrastructure/express/routes/auth.router.js";
import type { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";

interface RouteLayer {
  route?: {
    path: string;
    stack: { handle: (req: Request, res: Response) => void }[];
  };
}

function findRoute(
  router: express.Router,
  path: string,
): RouteLayer["route"] | undefined {
  const stack = (router as unknown as { stack: RouteLayer[] }).stack;
  return stack.find((layer) => layer.route?.path === path)?.route;
}

describe("createAuthRouter", () => {
  let authAdaptor: AuthAdaptor;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    authAdaptor = stubInterface<AuthAdaptor>();
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    sinon.restore();
  });

  describe("when NODE_ENV is test", () => {
    it("registers the /test-login route", () => {
      process.env.NODE_ENV = "test";

      const router = createAuthRouter(express.Router(), authAdaptor);

      assert.notEqual(findRoute(router, "/test-login"), undefined);
    });

    it("seeds the session and redirects to home", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.user, { name: "External Test [LAA]" });
      assert.equal(req.session.accessToken, "test-access-token");
      assert.equal(req.session.userId, "test-provider");
      assert.equal(req.session.firmId, "123");
      assert.equal(req.session.officeId, "A001B");
      assert.deepEqual(req.session.userOfficeAccounts, ["A001B", "A002B"]);
      assert.equal(req.session.providerEmail, "test@example.com");
      assert.equal(res.redirect.callCount, 1);
      assert.equal(res.redirect.firstCall.args[0], "/");
    });

    it("seeds both provider roles by default", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.roles, [
        APP_ROLES.APPLICATION_USER,
        APP_ROLES.CLAIMS_USER,
      ]);
    });

    it("seeds only the application role when role=application", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;
      req.query = { role: "application" } as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.roles, [APP_ROLES.APPLICATION_USER]);
    });

    it("seeds only the claims role when role=claims", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;
      req.query = { role: "claims" } as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.roles, [APP_ROLES.CLAIMS_USER]);
    });

    it("seeds no roles when role=none", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;
      req.query = { role: "none" } as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.roles, []);
    });

    it("falls back to both roles for an unrecognised role query param", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;
      req.query = { role: "caseworker" } as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.roles, [
        APP_ROLES.APPLICATION_USER,
        APP_ROLES.CLAIMS_USER,
      ]);
    });

    it("overrides userOfficeAccounts from a comma-separated officeAccounts query param", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;
      req.query = { officeAccounts: "A004B, A005B" } as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.userOfficeAccounts, ["A004B", "A005B"]);
    });

    it("seeds an empty userOfficeAccounts when officeAccounts query param is empty", () => {
      process.env.NODE_ENV = "test";
      const router = createAuthRouter(express.Router(), authAdaptor);
      const route = findRoute(router, "/test-login");
      const req = stubInterface<Request>();
      const res = stubInterface<Response>();
      req.session = {} as never;
      req.query = { officeAccounts: "" } as never;

      route?.stack[0].handle(req, res);

      assert.deepEqual(req.session.userOfficeAccounts, []);
    });
  });

  describe("when NODE_ENV is not test", () => {
    it("does not register the /test-login route", () => {
      process.env.NODE_ENV = "production";

      const router = createAuthRouter(express.Router(), authAdaptor);

      assert.equal(findRoute(router, "/test-login"), undefined);
    });
  });
});
