import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface } from "ts-sinon";
import type { Request } from "express";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";
import { SessionExpiryReason } from "#src/infrastructure/express/session/sessionExpiry.js";
import {
  logAuthLoginFailed,
  logSessionCreated,
  logSessionIdRotated,
  logSessionTerminated,
  toTerminationReason,
} from "#src/infrastructure/express/session/sessionAudit.js";
import {
  AUTH_FAILURE_REASONS,
  SESSION_TERMINATION_REASONS,
} from "#src/infrastructure/locales/constants.js";

const NOW = 1_800_000_000_000;
const IDLE_MS = 1_200_000;
const ABSOLUTE_MS = 43_200_000;
const CREDENTIAL_MS = 3_600_000;
const SESSION_ID = "raw-session-id";

describe("sessionAudit", () => {
  let req: Request;
  let logAuditStub: sinon.SinonStub<Parameters<typeof logger.logAudit>, void>;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ now: NOW, toFake: ["Date"] });
    logAuditStub = sinon.stub(logger, "logAudit");
    req = stubInterface<Request>();
    req.sessionID = SESSION_ID;
    req.session = stubInterface<Request["session"]>();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it("logs authentication failure reasons and only allowlisted identity-provider error codes", () => {
    const idpCases: { input: unknown; expectedCode?: string }[] = [
      { input: undefined },
      { input: "access_denied", expectedCode: "access_denied" },
      { input: "private@example.com", expectedCode: "other" },
      { input: ["access_denied"], expectedCode: "other" },
      { input: { error: "private@example.com" }, expectedCode: "other" },
      { input: null, expectedCode: "other" },
    ];

    for (const { input, expectedCode } of idpCases) {
      logAuthLoginFailed(req, "test_fn", AUTH_FAILURE_REASONS.IDP_ERROR, input);

      assert.deepEqual(logAuditStub.lastCall.args[0], {
        functionName: "test_fn",
        message: "Authentication failed",
        request: req,
        extraContext: {
          event: "auth_login_failed",
          session_hash: hashSessionId(SESSION_ID),
          reason: "idp_error",
          ...(expectedCode === undefined
            ? {}
            : { idp_error_code: expectedCode }),
        },
      });
    }
    assert.equal(logAuditStub.callCount, idpCases.length);
    assert.deepEqual(AUTH_FAILURE_REASONS, {
      IDP_ERROR: "idp_error",
      MISSING_CODE: "missing_code",
      TOKEN_ACQUISITION_FAILED: "token_acquisition_failed",
      SESSION_REGENERATION_FAILED: "session_regeneration_failed",
      INVALID_CREDENTIAL_EXPIRY: "invalid_credential_expiry",
    });
  });

  it("logs mapped termination reasons with the supplied pre-destruction hash and route", () => {
    const sessionHash = hashSessionId(SESSION_ID);
    Object.defineProperty(req, "path", { value: "/auth/logout" });
    Reflect.deleteProperty(req, "session");
    req.sessionID = "replacement-session-id";
    const expiryReasons = [
      [SessionExpiryReason.Idle, "idle_timeout"],
      [SessionExpiryReason.Absolute, "absolute_timeout"],
      [SessionExpiryReason.Credential, "credential_expiry"],
      [SessionExpiryReason.Invalid, "invalid_session"],
    ] as const;

    for (const [expiryReason, expectedReason] of expiryReasons) {
      logSessionTerminated(
        req,
        "test_fn",
        sessionHash,
        toTerminationReason(expiryReason),
      );

      assert.deepEqual(logAuditStub.lastCall.args[0], {
        functionName: "test_fn",
        message: "Session terminated",
        request: req,
        extraContext: {
          event: "session_terminated",
          session_hash: sessionHash,
          reason: expectedReason,
          route: "/auth/logout",
        },
      });
    }
    assert.equal(logAuditStub.callCount, expiryReasons.length);
    assert.deepEqual(SESSION_TERMINATION_REASONS, {
      USER_LOGOUT: "user_logout",
      IDLE_TIMEOUT: "idle_timeout",
      ABSOLUTE_TIMEOUT: "absolute_timeout",
      CREDENTIAL_EXPIRY: "credential_expiry",
      INVALID_SESSION: "invalid_session",
      CREDENTIAL_REJECTED: "credential_rejected",
    });
  });

  it("logs the previous and current session hashes and recalculates the hash for each rotation", () => {
    const previousSessionHash = hashSessionId("previous-session-id");

    logSessionIdRotated(req, "test_fn", previousSessionHash, false);

    assert.equal(logAuditStub.callCount, 1);
    assert.deepEqual(logAuditStub.firstCall.args[0], {
      functionName: "test_fn",
      message: "Session ID rotated",
      request: req,
      extraContext: {
        event: "session_id_rotated",
        trigger: "login",
        previous_session_hash: previousSessionHash,
        session_hash: hashSessionId(SESSION_ID),
        previous_session_authenticated: false,
      },
    });

    req.sessionID = "rotated-session-id";
    logSessionIdRotated(req, "test_fn", hashSessionId(SESSION_ID), true);

    assert.equal(logAuditStub.callCount, 2);
    assert.deepEqual(logAuditStub.secondCall.args[0].extraContext, {
      event: "session_id_rotated",
      trigger: "login",
      previous_session_hash: hashSessionId(SESSION_ID),
      session_hash: hashSessionId("rotated-session-id"),
      previous_session_authenticated: true,
    });
  });

  it("logs the session hash and lifetime without identities, credentials or roles", () => {
    req.session.lifetime = {
      absoluteExpiresAt: NOW + ABSOLUTE_MS,
      credentialExpiresAt: NOW + CREDENTIAL_MS,
      lastActivityAt: NOW,
      idleTimeoutMs: IDLE_MS,
    };
    req.session.userId = "private-user-id";
    req.session.user = { name: "Private User" };
    req.session.accessToken = "private-access-token";
    req.session.roles = [APP_ROLES.APPLICATION_USER];

    logSessionCreated(req, "test_fn", "entra");

    assert.equal(logAuditStub.callCount, 1);
    assert.deepEqual(logAuditStub.firstCall.args[0], {
      functionName: "test_fn",
      message: "Session created",
      request: req,
      extraContext: {
        event: "session_created",
        session_hash: hashSessionId(SESSION_ID),
        login_method: "entra",
        idle_timeout_ms: IDLE_MS,
        absolute_timeout_ms: ABSOLUTE_MS,
        credential_expires_in_ms: CREDENTIAL_MS,
      },
    });
  });
});
