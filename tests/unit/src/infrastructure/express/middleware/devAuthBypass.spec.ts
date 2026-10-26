import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { seedDevAuthSession } from "#src/infrastructure/express/middleware/auth/devAuthBypass.js";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "#src/infrastructure/locales/constants.js";

describe("seedDevAuthSession", () => {
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;

  beforeEach(() => {
    req = stubInterface<Request>();
    req.sessionID = "dev-session-id";
    res = stubInterface<Response>();
    next = sinon.stub();
    req.session = { cookie: {} } as any;
    res.locals = {};
  });

  afterEach(() => {
    sinon.restore();
  });

  it("audits creation only when a development session is newly seeded", () => {
    sinon.useFakeTimers({ now: 1_800_000_000_000, toFake: ["Date"] });
    const logAudit = sinon.stub(logger, "logAudit").callsFake(() => {
      assert.equal(req.session.userId, "dev-user-id");
      assert.notEqual(req.session.lifetime, undefined);
    });

    seedDevAuthSession(req, res, next as NextFunction);
    seedDevAuthSession(req, res, next as NextFunction);

    assert.equal(logAudit.callCount, 1);
    assert.deepEqual(logAudit.firstCall.args[0].extraContext, {
      event: "session_created",
      session_hash: hashSessionId("dev-session-id"),
      login_method: "dev",
      idle_timeout_ms: SESSION_IDLE_TIMEOUT_MS,
      absolute_timeout_ms: SESSION_ABSOLUTE_TIMEOUT_MS,
      credential_expires_in_ms: SESSION_ABSOLUTE_TIMEOUT_MS,
    });
    assert.equal(next.callCount, 2);
  });

  it("seeds an authenticated user when session has no userId", () => {
    seedDevAuthSession(req, res, next as NextFunction);

    assert.equal(req.session.userId, "dev-user-id");
    assert.deepEqual(req.session.user, { name: "Developer User" });
    assert.equal(req.session.firmId, "123");
    assert.deepEqual(req.session.userOfficeAccounts, ["A001B", "A002B"]);
    assert.equal(req.session.providerEmail, "developer@example.com");
    assert.equal(req.session.accessToken, "dev-access-token");
    assert.deepEqual(req.session.roles, [
      APP_ROLES.APPLICATION_USER,
      APP_ROLES.CLAIMS_USER,
    ]);
    assert.equal(res.locals.userName, "Developer User");
    assert.equal(next.callCount, 1);
  });

  it("starts a session lifetime so the lifetime guard accepts the dev session", () => {
    seedDevAuthSession(req, res, next as NextFunction);

    assert.notEqual(req.session.lifetime, undefined);
    assert.ok(
      (req.session.lifetime?.credentialExpiresAt ?? 0) >=
        (req.session.lifetime?.absoluteExpiresAt ?? Infinity),
    );
  });

  it("does not overwrite an existing authenticated session", () => {
    req.session.userId = "existing-user-id";
    req.session.user = { name: "Existing User" };

    seedDevAuthSession(req, res, next as NextFunction);

    assert.equal(req.session.userId, "existing-user-id");
    assert.deepEqual(req.session.user, { name: "Existing User" });
    assert.equal(req.session.lifetime, undefined);
    assert.equal(next.callCount, 1);
  });
});
