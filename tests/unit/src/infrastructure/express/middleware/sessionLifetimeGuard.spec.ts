import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import type { SessionLifetime } from "express-session";
import { sessionLifetimeGuard } from "#src/infrastructure/express/middleware/auth/sessionLifetimeGuard.js";
import config from "#src/infrastructure/config/config.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "#src/infrastructure/locales/constants.js";

const NOW = 1_800_000_000_000;
const ONE_MINUTE_MS = 60_000;
const ONE_DAY_MS = 86_400_000;

describe("sessionLifetimeGuard", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;
  let destroy: sinon.SinonStub;
  let clock: sinon.SinonFakeTimers;

  const setPath = (path: string): void => {
    (req as unknown as { path: string }).path = path;
  };

  const lifetime = (): SessionLifetime => ({
    absoluteExpiresAt: NOW + SESSION_ABSOLUTE_TIMEOUT_MS,
    credentialExpiresAt: NOW + ONE_DAY_MS,
    lastActivityAt: NOW,
    idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers({ now: NOW, toFake: ["Date"] });
    req = stubInterface<Request>();
    req.sessionID = "original-session-id";
    res = stubInterface<Response>();
    next = sinon.stub();
    destroy = sinon.stub().callsArg(0);
    setPath("/");
    req.session = {
      cookie: {},
      destroy,
      userId: "user-1",
      lifetime: lifetime(),
    } as any;
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  const expectExpired = (): void => {
    assert.equal(destroy.callCount, 1);
    assert.deepEqual(res.clearCookie.firstCall.args, [config.session.name]);
    assert.equal(res.redirect.firstCall.args[0], "/auth/login");
    assert.equal(next.callCount, 0);
  };

  it("audits each expiry reason with the session hash before destruction instead of session_expired", () => {
    const logAudit = sinon.stub(logger, "logAudit");
    const logInfo = sinon.stub(logger, "logInfo");
    const cases: {
      lifetime: SessionLifetime | undefined;
      reason: string;
    }[] = [
      {
        lifetime: {
          ...lifetime(),
          lastActivityAt: NOW - SESSION_IDLE_TIMEOUT_MS,
        },
        reason: "idle_timeout",
      },
      {
        lifetime: { ...lifetime(), absoluteExpiresAt: NOW },
        reason: "absolute_timeout",
      },
      {
        lifetime: { ...lifetime(), credentialExpiresAt: NOW },
        reason: "credential_expiry",
      },
      { lifetime: undefined, reason: "invalid_session" },
    ];

    for (const entry of cases) {
      const session = stubInterface<Request["session"]>();
      session.userId = "private-user-id";
      session.lifetime = entry.lifetime;
      session.destroy.callsFake((callback) => {
        assert.equal(logAudit.callCount, 1);
        Reflect.deleteProperty(req, "session");
        req.sessionID = "replacement-session-id";
        callback?.(undefined);
        return session;
      });
      req.session = session;
      req.sessionID = "original-session-id";
      logAudit.resetHistory();

      sessionLifetimeGuard(req, res, next as NextFunction);

      assert.equal(session.destroy.callCount, 1);
      assert.deepEqual(logAudit.firstCall.args[0].extraContext, {
        event: "session_terminated",
        session_hash: hashSessionId("original-session-id"),
        reason: entry.reason,
        route: "/",
      });
      assert.equal(logInfo.callCount, 0);
    }
  });

  it("calls next without checks for public paths", () => {
    setPath("/auth/login");
    req.session.lifetime = undefined;

    sessionLifetimeGuard(req, res, next as NextFunction);

    assert.equal(next.callCount, 1);
    assert.equal(destroy.callCount, 0);
  });

  it("calls next without checks for health endpoints", () => {
    setPath("/health");
    req.session.lifetime = undefined;

    sessionLifetimeGuard(req, res, next as NextFunction);

    assert.equal(next.callCount, 1);
    assert.equal(destroy.callCount, 0);
  });

  it("calls next without checks when there is no signed-in user", () => {
    req.session.userId = undefined;
    req.session.lifetime = undefined;

    sessionLifetimeGuard(req, res, next as NextFunction);

    assert.equal(next.callCount, 1);
    assert.equal(destroy.callCount, 0);
  });

  it("records activity without moving the absolute or credential deadlines", () => {
    clock.tick(ONE_MINUTE_MS);

    sessionLifetimeGuard(req, res, next as NextFunction);

    assert.equal(next.callCount, 1);
    assert.equal(req.session.lifetime?.lastActivityAt, NOW + ONE_MINUTE_MS);
    assert.equal(
      req.session.lifetime?.absoluteExpiresAt,
      NOW + SESSION_ABSOLUTE_TIMEOUT_MS,
    );
    assert.equal(req.session.lifetime?.credentialExpiresAt, NOW + ONE_DAY_MS);
    assert.equal(req.session.cookie.maxAge, SESSION_IDLE_TIMEOUT_MS);
  });

  it("expires the session after the idle timeout", () => {
    clock.tick(SESSION_IDLE_TIMEOUT_MS);

    sessionLifetimeGuard(req, res, next as NextFunction);

    expectExpired();
  });

  it("expires the session at the absolute deadline despite activity every 19 minutes", () => {
    const activityInterval = SESSION_IDLE_TIMEOUT_MS - ONE_MINUTE_MS;
    while (Date.now() + activityInterval < NOW + SESSION_ABSOLUTE_TIMEOUT_MS) {
      clock.tick(activityInterval);
      sessionLifetimeGuard(req, res, next as NextFunction);
    }
    assert.equal(destroy.callCount, 0);
    next.resetHistory();

    clock.tick(activityInterval);
    sessionLifetimeGuard(req, res, next as NextFunction);

    expectExpired();
  });

  it("expires the session when the credential expires first", () => {
    req.session.lifetime = {
      ...lifetime(),
      credentialExpiresAt: NOW + ONE_MINUTE_MS,
    };
    clock.tick(ONE_MINUTE_MS);

    sessionLifetimeGuard(req, res, next as NextFunction);

    expectExpired();
  });

  it("expires a signed-in session that has no lifetime", () => {
    req.session.lifetime = undefined;

    sessionLifetimeGuard(req, res, next as NextFunction);

    expectExpired();
  });

  it("passes the error to next when destroying the session fails", () => {
    const destroyError = new Error("store failure");
    destroy.callsArgWith(0, destroyError);
    clock.tick(SESSION_IDLE_TIMEOUT_MS);

    sessionLifetimeGuard(req, res, next as NextFunction);

    assert.equal(next.firstCall.args[0], destroyError);
    assert.equal(res.clearCookie.callCount, 1);
    assert.equal(res.redirect.callCount, 0);
  });
});
