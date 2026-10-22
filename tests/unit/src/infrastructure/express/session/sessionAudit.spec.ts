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

  const lastExtraContext = (): Record<string, unknown> | undefined =>
    logAuditStub.lastCall.args[0].extraContext;

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

  describe("toTerminationReason", () => {
    it("maps each expiry reason to a termination reason", () => {
      assert.equal(
        toTerminationReason(SessionExpiryReason.Idle),
        SESSION_TERMINATION_REASONS.IDLE_TIMEOUT,
      );
      assert.equal(
        toTerminationReason(SessionExpiryReason.Absolute),
        SESSION_TERMINATION_REASONS.ABSOLUTE_TIMEOUT,
      );
      assert.equal(
        toTerminationReason(SessionExpiryReason.Credential),
        SESSION_TERMINATION_REASONS.CREDENTIAL_EXPIRY,
      );
      assert.equal(
        toTerminationReason(SessionExpiryReason.Invalid),
        SESSION_TERMINATION_REASONS.INVALID_SESSION,
      );
    });

    it("defines the supported termination reason codes", () => {
      assert.deepEqual(SESSION_TERMINATION_REASONS, {
        USER_LOGOUT: "user_logout",
        IDLE_TIMEOUT: "idle_timeout",
        ABSOLUTE_TIMEOUT: "absolute_timeout",
        CREDENTIAL_EXPIRY: "credential_expiry",
        INVALID_SESSION: "invalid_session",
        CREDENTIAL_REJECTED: "credential_rejected",
      });
    });
  });

  describe("logSessionIdRotated", () => {
    it("logs the previous and current session hashes", () => {
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
    });

    it("recalculates the current hash for each rotation", () => {
      logSessionIdRotated(req, "test_fn", "previous-hash", false);

      req.sessionID = "rotated-session-id";
      logSessionIdRotated(req, "test_fn", hashSessionId(SESSION_ID), true);

      assert.equal(logAuditStub.callCount, 2);
      assert.deepEqual(lastExtraContext(), {
        event: "session_id_rotated",
        trigger: "login",
        previous_session_hash: hashSessionId(SESSION_ID),
        session_hash: hashSessionId("rotated-session-id"),
        previous_session_authenticated: true,
      });
    });
  });

  describe("logSessionCreated", () => {
    it("logs the session hash and lifetime without user details", () => {
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

  describe("logSessionTerminated", () => {
    it("logs the supplied session hash, reason and route", () => {
      const sessionHash = hashSessionId(SESSION_ID);
      Object.defineProperty(req, "path", { value: "/auth/logout" });
      Reflect.deleteProperty(req, "session");
      req.sessionID = "replacement-session-id";

      logSessionTerminated(
        req,
        "test_fn",
        sessionHash,
        SESSION_TERMINATION_REASONS.USER_LOGOUT,
      );

      assert.equal(logAuditStub.callCount, 1);
      assert.deepEqual(logAuditStub.firstCall.args[0], {
        functionName: "test_fn",
        message: "Session terminated",
        request: req,
        extraContext: {
          event: "session_terminated",
          session_hash: sessionHash,
          reason: SESSION_TERMINATION_REASONS.USER_LOGOUT,
          route: "/auth/logout",
        },
      });
    });
  });

  describe("logAuthLoginFailed", () => {
    it("logs the reason without an idp error code when none is given", () => {
      logAuthLoginFailed(
        req,
        "test_fn",
        AUTH_FAILURE_REASONS.TOKEN_ACQUISITION_FAILED,
      );

      assert.equal(logAuditStub.callCount, 1);
      assert.deepEqual(logAuditStub.firstCall.args[0], {
        functionName: "test_fn",
        message: "Authentication failed",
        request: req,
        extraContext: {
          event: "auth_login_failed",
          session_hash: hashSessionId(SESSION_ID),
          reason: AUTH_FAILURE_REASONS.TOKEN_ACQUISITION_FAILED,
        },
      });
    });

    it("logs a recognised idp error code", () => {
      logAuthLoginFailed(
        req,
        "test_fn",
        AUTH_FAILURE_REASONS.IDP_ERROR,
        "access_denied",
      );

      assert.equal(logAuditStub.callCount, 1);
      assert.deepEqual(lastExtraContext(), {
        event: "auth_login_failed",
        session_hash: hashSessionId(SESSION_ID),
        reason: AUTH_FAILURE_REASONS.IDP_ERROR,
        idp_error_code: "access_denied",
      });
    });

    const unrecognisedCodes = [
      {
        description: "an unrecognised idp error code",
        input: "private@example.com",
      },
      { description: "an array idp error code", input: ["access_denied"] },
      {
        description: "an object idp error code",
        input: { error: "private@example.com" },
      },
      { description: "a null idp error code", input: null },
    ];

    for (const { description, input } of unrecognisedCodes) {
      it(`replaces ${description} with other`, () => {
        logAuthLoginFailed(
          req,
          "test_fn",
          AUTH_FAILURE_REASONS.IDP_ERROR,
          input,
        );

        assert.equal(logAuditStub.callCount, 1);
        assert.deepEqual(lastExtraContext(), {
          event: "auth_login_failed",
          session_hash: hashSessionId(SESSION_ID),
          reason: AUTH_FAILURE_REASONS.IDP_ERROR,
          idp_error_code: "other",
        });
      });
    }

    it("defines the supported authentication failure reason codes", () => {
      assert.deepEqual(AUTH_FAILURE_REASONS, {
        IDP_ERROR: "idp_error",
        MISSING_CODE: "missing_code",
        TOKEN_ACQUISITION_FAILED: "token_acquisition_failed",
        SESSION_REGENERATION_FAILED: "session_regeneration_failed",
        INVALID_CREDENTIAL_EXPIRY: "invalid_credential_expiry",
      });
    });
  });

  it("never logs the raw session id", () => {
    logSessionIdRotated(req, "test_fn", "previous-hash", true);
    logSessionCreated(req, "test_fn", "entra");
    logSessionTerminated(
      req,
      "test_fn",
      hashSessionId(SESSION_ID),
      SESSION_TERMINATION_REASONS.USER_LOGOUT,
    );
    logAuthLoginFailed(req, "test_fn", AUTH_FAILURE_REASONS.MISSING_CODE);

    for (const call of logAuditStub.getCalls()) {
      const { message, extraContext } = call.args[0];
      assert.equal(
        JSON.stringify({ message, extraContext }).includes(SESSION_ID),
        false,
      );
    }
  });
});
