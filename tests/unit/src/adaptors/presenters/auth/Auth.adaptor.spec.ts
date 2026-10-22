import { strict as assert } from "assert";
import sinon from "sinon";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { Request, Response, NextFunction } from "express";
import { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import type { AuthPort } from "#src/ports/auth/Auth.port.js";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";
import config from "#src/infrastructure/config/config.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { hashSessionId } from "#src/infrastructure/express/session/sessionHash.js";
import {
  ApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_EXPIRY_BUFFER_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "#src/infrastructure/locales/constants.js";

const REDIRECT_URI = "http://localhost:3000/auth/callback";
const POST_LOGOUT_URI = "http://localhost:3000";
const AUTH_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "api://test-api-client-id/User.Provider",
];

describe("AuthAdaptor", () => {
  let authPort: StubbedInstance<AuthPort>;
  let req: StubbedInstance<Request>;
  let res: StubbedInstance<Response>;
  let next: sinon.SinonStub;
  let adaptor: AuthAdaptor;

  beforeEach(() => {
    authPort = stubInterface<AuthPort>();
    req = stubInterface<Request>();
    req.sessionID = "original-session-id";
    res = stubInterface<Response>();
    next = sinon.stub();
    req.session = {} as any;
    adaptor = new AuthAdaptor(
      authPort,
      REDIRECT_URI,
      POST_LOGOUT_URI,
      AUTH_SCOPES,
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("login", () => {
    it("redirects to the auth code URL", async () => {
      const authUrl =
        "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize?client_id=test";
      authPort.getAuthCodeUrl.resolves(authUrl);

      await adaptor.login(req, res);

      assert.deepEqual(authPort.getAuthCodeUrl.firstCall.args[0], AUTH_SCOPES);
      assert.equal(authPort.getAuthCodeUrl.firstCall.args[1], REDIRECT_URI);
      assert.equal(res.redirect.callCount, 1);
      assert.equal(res.redirect.firstCall.args[0], authUrl);
    });

    it("propagates error when auth port throws", async () => {
      authPort.getAuthCodeUrl.rejects(new Error("auth port failure"));

      await assert.rejects(() => adaptor.login(req, res), /auth port failure/);
    });
  });

  describe("callback", () => {
    const NOW = 1_800_000_000_000;
    const ONE_HOUR_MS = 3_600_000;
    const TEN_MINUTES_MS = 600_000;
    let clock: sinon.SinonFakeTimers;
    let originalSession: Request["session"];
    let regenerate: sinon.SinonStub;

    // Mirrors express-session, which swaps in a fresh session object on regenerate.
    const stubRegenerate = (error: Error | null = null): void => {
      regenerate = sinon
        .stub()
        .callsFake((callback: (err: unknown) => void) => {
          if (error === null) {
            req.session = { cookie: {} } as any;
            req.sessionID = "regenerated-session-id";
          }
          callback(error);
        });
      req.session.regenerate = regenerate as any;
    };

    beforeEach(() => {
      clock = sinon.useFakeTimers({ now: NOW, toFake: ["Date"] });
      req.session.cookie = {} as any;
      originalSession = req.session;
      stubRegenerate();
    });

    afterEach(() => {
      clock.restore();
    });

    it("audits each failed callback step and preserves the failure without logging credentials", async () => {
      const logAudit = sinon.stub(logger, "logAudit");
      const tokenError = new ApplicationError(
        APPLICATION_ERROR_TYPES.UPSTREAM_UNAVAILABLE,
        "acquire_token",
        true,
      );
      const regenerationError = new Error("store failure");
      const cases = [
        { reason: "token_acquisition_failed", error: tokenError },
        {
          reason: "session_regeneration_failed",
          error: regenerationError,
        },
        { reason: "invalid_credential_expiry", error: undefined },
      ];
      req.query = { code: "private-auth-code" };

      for (const { reason, error } of cases) {
        req.session = stubInterface<Request["session"]>();
        req.sessionID = "original-session-id";
        stubRegenerate(
          reason === "session_regeneration_failed" ? regenerationError : null,
        );
        authPort.acquireTokenByCode.resolves({
          userId: "private-user-id",
          userOfficeAccounts: [],
          accessToken: "private-access-token",
          accessTokenExpiresOn:
            reason === "invalid_credential_expiry"
              ? undefined
              : new Date(NOW + ONE_HOUR_MS),
          roles: [APP_ROLES.APPLICATION_USER],
        });
        if (reason === "token_acquisition_failed") {
          authPort.acquireTokenByCode.rejects(tokenError);
        }
        logAudit.resetHistory();

        await assert.rejects(
          () => adaptor.callback(req, res),
          (caught: unknown) => {
            if (error !== undefined) {
              assert.equal(caught, error);
            } else {
              assert.ok(caught instanceof Error);
              assert.equal(
                caught.message,
                "Cannot start session: missing or invalid access token expiry",
              );
            }
            return true;
          },
        );

        const failures = logAudit
          .getCalls()
          .filter(
            (call) => call.args[0].extraContext?.event === "auth_login_failed",
          );
        assert.equal(failures.length, 1);
        assert.deepEqual(failures[0]?.args[0].extraContext, {
          event: "auth_login_failed",
          session_hash: hashSessionId(req.sessionID),
          reason,
        });
        assert.equal(
          logAudit
            .getCalls()
            .some(
              (call) => call.args[0].extraContext?.event === "session_created",
            ),
          false,
        );
        assert.equal(res.redirect.callCount, 0);
        assert.equal(res.render.callCount, 0);
      }
    });

    it("audits rotation before creation after writing the authenticated session", async () => {
      const logAudit = sinon.stub(logger, "logAudit").callsFake((input) => {
        if (input.extraContext?.event === "session_created") {
          assert.equal(req.session.userId, "user-oid-abc");
          assert.notEqual(req.session.lifetime, undefined);
        } else if (input.extraContext?.event === "session_id_rotated") {
          assert.equal(req.session.userId, undefined);
        }
      });
      req.query = { code: "auth-code-123" };
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW + ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      for (const previousUserId of [undefined, "previous-user-id"]) {
        req.sessionID = "original-session-id";
        req.session.userId = previousUserId;
        stubRegenerate();
        logAudit.resetHistory();

        await adaptor.callback(req, res);

        assert.equal(logAudit.callCount, 2);
        assert.deepEqual(logAudit.firstCall.args[0].extraContext, {
          event: "session_id_rotated",
          trigger: "login",
          previous_session_hash: hashSessionId("original-session-id"),
          session_hash: hashSessionId("regenerated-session-id"),
          previous_session_authenticated: previousUserId !== undefined,
        });
        assert.deepEqual(logAudit.secondCall.args[0].extraContext, {
          event: "session_created",
          session_hash: hashSessionId("regenerated-session-id"),
          login_method: "entra",
          idle_timeout_ms: SESSION_IDLE_TIMEOUT_MS,
          absolute_timeout_ms: SESSION_ABSOLUTE_TIMEOUT_MS,
          credential_expires_in_ms: ONE_HOUR_MS - SESSION_EXPIRY_BUFFER_MS,
        });
      }
    });

    it("rejects invalid callbacks with a 400 page and a safe audit without acquiring credentials", async () => {
      const logAudit = sinon.stub(logger, "logAudit");
      res.status.returns(res);
      const cases: {
        query: Request["query"];
        reason: string;
        idpCode?: string;
      }[] = [
        { query: {}, reason: "missing_code" },
        { query: { code: "" }, reason: "missing_code" },
        { query: { code: ["one", "two"] }, reason: "missing_code" },
        {
          query: { error: "access_denied" },
          reason: "idp_error",
          idpCode: "access_denied",
        },
        {
          query: { code: "private-auth-code", error: "private@example.com" },
          reason: "idp_error",
          idpCode: "other",
        },
      ];

      for (const { query, reason, idpCode } of cases) {
        req.query = query;

        await adaptor.callback(req, res);

        assert.deepEqual(res.status.lastCall.args, [400]);
        assert.deepEqual(res.render.lastCall.args, [
          "main/error",
          { status: 400, message: "Invalid request" },
        ]);
        assert.deepEqual(logAudit.lastCall.args[0].extraContext, {
          event: "auth_login_failed",
          session_hash: hashSessionId("original-session-id"),
          reason,
          ...(idpCode === undefined ? {} : { idp_error_code: idpCode }),
        });
      }
      assert.equal(logAudit.callCount, cases.length);
      assert.equal(authPort.acquireTokenByCode.callCount, 0);
      assert.equal(regenerate.callCount, 0);
      assert.equal(res.redirect.callCount, 0);
      assert.equal(res.status.callCount, cases.length);
      assert.equal(res.render.callCount, cases.length);
    });

    it("stores required data in session and redirects to /", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userName: "Test User",
        firmId: "123",
        firmName: "Test Firm",
        userOfficeAccounts: ["A001B", "A002B"],
        providerEmail: "test@example.com",
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(Date.now() + ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER],
      });

      await adaptor.callback(req, res);

      assert.equal(
        authPort.acquireTokenByCode.firstCall.args[0],
        "auth-code-123",
      );
      assert.deepEqual(
        authPort.acquireTokenByCode.firstCall.args[1],
        AUTH_SCOPES,
      );
      assert.equal(req.session["userId"], "user-oid-abc");
      assert.deepEqual(req.session["user"], { name: "Test User" });
      assert.equal(req.session["firmId"], "123");
      assert.equal(req.session["firmName"], "Test Firm");
      assert.deepEqual(req.session["userOfficeAccounts"], ["A001B", "A002B"]);
      assert.equal(req.session["providerEmail"], "test@example.com");
      assert.equal(req.session["accessToken"], "access-token-123");
      assert.deepEqual(req.session["roles"], [
        APP_ROLES.APPLICATION_USER,
        APP_ROLES.CLAIMS_USER,
      ]);
      assert.equal(res.redirect.callCount, 1);
      assert.equal(res.redirect.firstCall.args[0], "/");
    });

    it("regenerates the session before storing the user on the new session", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW + ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await adaptor.callback(req, res);

      assert.equal(regenerate.callCount, 1);
      assert.notEqual(req.session, originalSession);
      assert.equal(originalSession["userId"], undefined);
      assert.equal(req.session["userId"], "user-oid-abc");
    });

    it("stores no user and propagates the error when regenerate fails", async () => {
      req.query = { code: "auth-code-123" } as any;
      stubRegenerate(new Error("store failure"));
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW + ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await assert.rejects(() => adaptor.callback(req, res), /store failure/);

      assert.equal(req.session["userId"], undefined);
      assert.equal(req.session["accessToken"], undefined);
      assert.equal(res.redirect.callCount, 0);
    });

    it("starts the session lifetime from the token expiry", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW + ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await adaptor.callback(req, res);

      assert.deepEqual(req.session.lifetime, {
        absoluteExpiresAt: NOW + SESSION_ABSOLUTE_TIMEOUT_MS,
        credentialExpiresAt: NOW + ONE_HOUR_MS - SESSION_EXPIRY_BUFFER_MS,
        lastActivityAt: NOW,
        idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
      });
    });

    it("caps the session cookie maxAge at the idle timeout when the token outlives it", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userName: "Test User",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW + ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await adaptor.callback(req, res);

      assert.equal(req.session.cookie.maxAge, SESSION_IDLE_TIMEOUT_MS);
    });

    it("sets the session cookie maxAge to the token expiry minus the buffer when that is earliest", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW + TEN_MINUTES_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await adaptor.callback(req, res);

      assert.equal(
        req.session.cookie.maxAge,
        TEN_MINUTES_MS - SESSION_EXPIRY_BUFFER_MS,
      );
    });

    it("clamps the session cookie maxAge to zero when the token has already expired", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        accessTokenExpiresOn: new Date(NOW - ONE_HOUR_MS),
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await adaptor.callback(req, res);

      assert.equal(req.session.cookie.maxAge, 0);
    });

    it("throws and stores no user when the auth response has no access token expiry", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.resolves({
        userId: "user-oid-abc",
        userOfficeAccounts: [],
        accessToken: "access-token-123",
        roles: [APP_ROLES.APPLICATION_USER],
      });

      await assert.rejects(
        () => adaptor.callback(req, res),
        /access token expiry/i,
      );

      assert.equal(req.session["userId"], undefined);
      assert.equal(req.session["accessToken"], undefined);
      assert.equal(res.redirect.callCount, 0);
    });

    it("propagates error when auth port throws on callback", async () => {
      req.query = { code: "auth-code-123" } as any;
      authPort.acquireTokenByCode.rejects(new Error("token exchange failed"));

      await assert.rejects(
        () => adaptor.callback(req, res),
        /token exchange failed/,
      );
    });
  });

  describe("logout", () => {
    it("audits only successfully destroyed authenticated sessions using the original hash", () => {
      const logAudit = sinon.stub(logger, "logAudit");
      Object.defineProperty(req, "path", { value: "/auth/logout" });
      const destroyError = new Error("store failure");
      const cases = [
        { userId: "private-user-id", error: undefined },
        { userId: undefined, error: undefined },
        { userId: "private-user-id", error: destroyError },
      ];

      for (const { userId, error } of cases) {
        const session = stubInterface<Request["session"]>();
        session.userId = userId;
        let complete: ((err?: unknown) => void) | undefined;
        session.destroy.callsFake((callback) => {
          complete = callback;
          return session;
        });
        req.session = session;
        req.sessionID = "original-session-id";
        logAudit.resetHistory();
        next.resetHistory();
        res.redirect.resetHistory();

        adaptor.logout(req, res, next as NextFunction);

        assert.equal(logAudit.callCount, 0);
        Reflect.deleteProperty(req, "session");
        req.sessionID = "replacement-session-id";
        assert.ok(complete);
        complete(error);

        if (userId !== undefined && error === undefined) {
          assert.equal(logAudit.callCount, 1);
          assert.deepEqual(logAudit.firstCall.args[0].extraContext, {
            event: "session_terminated",
            session_hash: hashSessionId("original-session-id"),
            reason: "user_logout",
            route: "/auth/logout",
          });
        } else {
          assert.equal(logAudit.callCount, 0);
        }
        if (error !== undefined) {
          assert.equal(next.firstCall.args[0], error);
          assert.equal(res.redirect.callCount, 0);
        } else {
          assert.equal(next.callCount, 0);
          assert.equal(res.redirect.callCount, 1);
        }
      }
    });

    it("destroys session and redirects to post logout URI", () => {
      req.session.destroy = sinon.stub().callsArg(0) as any;

      adaptor.logout(req, res, next as NextFunction);

      assert.equal((req.session.destroy as sinon.SinonStub).callCount, 1);
      assert.deepEqual(res.clearCookie.firstCall.args, [config.session.name]);
      assert.equal(res.redirect.callCount, 1);
      assert.equal(
        res.redirect.firstCall.args[0],
        `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${POST_LOGOUT_URI}`,
      );
    });

    it("calls next with error when session destroy fails", () => {
      const destroyError = new Error("store failure");
      req.session.destroy = sinon.stub().callsArgWith(0, destroyError) as any;

      adaptor.logout(req, res, next as NextFunction);

      assert.equal(next.callCount, 1);
      assert.equal(next.firstCall.args[0], destroyError);
      assert.equal(res.clearCookie.callCount, 1);
      assert.equal(res.redirect.callCount, 0);
    });
  });
});
