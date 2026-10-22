import { strict as assert } from "assert";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { handleAuthErrors } from "#src/infrastructure/express/middleware/errors/authErrors.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";
import { ERROR_PAGE_MESSAGE } from "#src/infrastructure/locales/constants.js";

describe("handleAuthErrors", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  beforeEach(() => {
    req = stubInterface<Request>();
    req.sessionID = "original-session-id";
    res = stubInterface<Response>();
    res.status.returns(res);
    next = sinon.stub();
    (req as unknown as { path: string }).path = "/apply/public-authority";
  });

  afterEach(() => {
    sinon.restore();
  });

  const authError = new ApplicationError(
    APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED,
    "get_public_bodies",
    false,
  );

  it("retains the auth warning and audits credential rejection before best-effort destruction", () => {
    const logWarn = sinon.stub(logger, "logWarn");
    const logAudit = sinon.stub(logger, "logAudit");

    for (const destroyError of [undefined, new Error("store unavailable")]) {
      const session = stubInterface<Request["session"]>();
      session.destroy.callsFake((callback) => {
        assert.equal(logWarn.callCount, 1);
        assert.equal(logAudit.callCount, 1);
        Reflect.deleteProperty(req, "session");
        req.sessionID = "replacement-session-id";
        callback?.(destroyError);
        return session;
      });
      req.session = session;
      req.sessionID = "original-session-id";
      logWarn.resetHistory();
      logAudit.resetHistory();
      res.redirect.resetHistory();

      handleAuthErrors(authError, req, res, next as NextFunction);

      assert.deepEqual(logWarn.firstCall.args[0].extraContext, {
        event: "auth_session_expired",
        operation: "get_public_bodies",
      });
      assert.deepEqual(logAudit.firstCall.args[0].extraContext, {
        event: "session_terminated",
        session_hash: hashSessionId("original-session-id"),
        reason: "credential_rejected",
        route: "/apply/public-authority",
      });
      assert.deepEqual(res.redirect.firstCall.args, ["/auth/login"]);
      assert.equal(next.callCount, 0);
    }
  });

  it("passes non-application errors to next", () => {
    const err = new Error("boom");

    handleAuthErrors(
      err,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(next.callCount, 1);
    assert.equal(next.firstCall.args[0], err);
  });

  it("destroys the session and redirects to login on AUTHENTICATION_REQUIRED", () => {
    req.session.destroy = sinon
      .stub()
      .callsFake((cb: (err?: unknown) => void) => {
        cb();
        return req.session;
      }) as unknown as Request["session"]["destroy"];

    handleAuthErrors(
      authError,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(res.redirect.callCount, 1);
    assert.equal(res.redirect.firstCall.args[0], "/auth/login");
    assert.equal(next.callCount, 0);
  });

  it("still redirects when session destruction fails", () => {
    req.session.destroy = sinon
      .stub()
      .callsFake((cb: (err?: unknown) => void) => {
        cb(new Error("store unavailable"));
        return req.session;
      }) as unknown as Request["session"]["destroy"];

    handleAuthErrors(
      authError,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(res.redirect.callCount, 1);
    assert.equal(res.redirect.firstCall.args[0], "/auth/login");
  });

  it("does not redirect an auth-route request, forwarding to next instead", () => {
    (req as unknown as { path: string }).path = "/auth/login";

    handleAuthErrors(
      authError,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(res.redirect.callCount, 0);
    assert.equal(next.callCount, 1);
    assert.equal(next.firstCall.args[0], authError);
  });

  it("renders a 403 page on FORBIDDEN", () => {
    const forbidden = new ApplicationError(
      APPLICATION_ERROR_TYPES.FORBIDDEN,
      "get_public_bodies",
      false,
    );

    handleAuthErrors(
      forbidden,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(res.status.firstCall.args[0], 403);
    assert.equal(res.render.callCount, 1);
    assert.deepEqual(res.render.firstCall.args, ["main/error-unauthorised"]);
    assert.equal(next.callCount, 0);
  });

  it("forwards other application errors to next", () => {
    const unavailable = new ApplicationError(
      APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
      "get_public_bodies",
      true,
    );

    handleAuthErrors(
      unavailable,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(next.callCount, 1);
    assert.equal(next.firstCall.args[0], unavailable);
    assert.equal(res.render.callCount, 0);
    assert.equal(res.redirect.callCount, 0);
  });

  it("logs the auth_session_expired event once for AUTHENTICATION_REQUIRED", () => {
    const logSpy = sinon.spy(logger, "logWarn");
    req.session.destroy = sinon
      .stub()
      .callsFake((cb: (err?: unknown) => void) => {
        cb();
        return req.session;
      }) as unknown as Request["session"]["destroy"];

    handleAuthErrors(
      authError,
      req as unknown as Request,
      res as unknown as Response,
      next as unknown as NextFunction,
    );

    assert.equal(logSpy.callCount, 1);
    assert.equal(
      logSpy.firstCall.args[0].extraContext?.event,
      "auth_session_expired",
    );
    assert.equal(
      logSpy.firstCall.args[0].extraContext?.operation,
      "get_public_bodies",
    );
  });
});
