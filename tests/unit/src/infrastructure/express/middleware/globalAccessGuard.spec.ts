import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { globalAccessGuard } from "#src/infrastructure/express/middleware/accessControl/globalAccessGuard.js";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";
import { HTTP_FORBIDDEN } from "#src/infrastructure/locales/constants.js";
import { logger } from "#src/infrastructure/logging/logger.js";
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
    next = sinon.stub();
    req.session = {} as never;
    req.method = "GET";
    res.status.returns(res as unknown as Response);
  });

  afterEach(() => {
    sinon.restore();
  });

  const setPath = (path: string): void => {
    (req as unknown as { path: string }).path = path;
  };
  const asRequest = (): Request => req as unknown as Request;
  const asResponse = (): Response => res as unknown as Response;

  describe("public and infrastructure routes", () => {
    for (const path of ["/health", "/status", "/error", "/auth/login"]) {
      it(`allows ${path} without any authorisation check`, () => {
        setPath(path);

        globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

        assert.equal(next.callCount, 1);
        assert.equal(res.render.callCount, 0);
      });
    }
  });

  describe("unauthenticated requests", () => {
    it("defers to requireAuth by calling next without rendering", () => {
      setPath("/apply");

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(res.render.callCount, 0);
      assert.equal(res.status.callCount, 0);
    });
  });

  describe("authenticated authorisation", () => {
    beforeEach(() => {
      req.session.userId = "user-1";
    });

    it("allows an application user to access /apply", () => {
      setPath("/apply/client-details");
      req.session.roles = [APP_ROLES.APPLICATION_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(res.render.callCount, 0);
    });

    it("denies a claims user access to /apply", () => {
      setPath("/apply/client-details");
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
      assert.equal(res.render.callCount, 1);
    });

    it("allows a claims user to access /claim", () => {
      setPath("/claim/evidence");
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(res.render.callCount, 0);
    });

    it("denies an application user access to /claim", () => {
      setPath("/claim/evidence");
      req.session.roles = [APP_ROLES.APPLICATION_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
    });

    it("allows access when user has multiple roles including the permitted role", () => {
      setPath("/apply");
      req.session.roles = [APP_ROLES.CLAIMS_USER, APP_ROLES.APPLICATION_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 1);
    });

    it("denies an authenticated user without a role", () => {
      setPath("/apply");
      req.session.roles = [];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
    });

    it("denies when the session has no roles at all", () => {
      setPath("/apply");

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
    });

    it("denies an authenticated request to an unconfigured route", () => {
      setPath("/random-page");
      req.session.roles = [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
    });

    it("does not treat /applycation as /apply (segment boundary)", () => {
      setPath("/applycation");
      req.session.roles = [APP_ROLES.APPLICATION_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.firstCall.args[0], HTTP_FORBIDDEN);
    });

    it("renders the shared error page with the localized access-denied copy", () => {
      setPath("/apply");
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(res.render.callCount, 1);
      const [template, locals] = res.render.firstCall.args as unknown as [
        string,
        { status: number; error: string },
      ];
      assert.equal(template, "main/error");
      assert.equal(locals.status, HTTP_FORBIDDEN);
      assert.equal(
        locals.error,
        "You do not have permission to access this page.",
      );
    });

    it("logs one structured warning with non-sensitive metadata only", () => {
      const logSpy = sinon.spy(logger, "logWarn");
      setPath("/apply");
      req.method = "POST";
      req.session.roles = [APP_ROLES.CLAIMS_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(logSpy.callCount, 1);
      assert.deepEqual(logSpy.firstCall.args[0].extraContext, {
        event: "access_denied",
        reason: "insufficient_role",
        route: "/apply",
        method: "POST",
        status_code: HTTP_FORBIDDEN,
      });
    });

    it("uses the unconfigured_route reason code for unknown routes", () => {
      const logSpy = sinon.spy(logger, "logWarn");
      setPath("/random-page");
      req.session.roles = [APP_ROLES.APPLICATION_USER];

      globalAccessGuard(asRequest(), asResponse(), next as NextFunction);

      assert.equal(
        logSpy.firstCall.args[0].extraContext?.reason,
        "unconfigured_route",
      );
    });
  });
});
