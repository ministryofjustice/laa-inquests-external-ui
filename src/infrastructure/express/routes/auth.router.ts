import type { NextFunction, Request, Response, Router } from "express";
import type { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import { startSessionLifetime } from "#src/infrastructure/express/session/sessionExpiry.js";
import { logSessionCreated } from "#src/infrastructure/express/session/sessionAudit.js";
import {
  APP_ROLES,
  type ProviderRole,
} from "#src/infrastructure/config/accessControl.js";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_EXPIRY_BUFFER_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "#src/infrastructure/locales/constants.js";

const MILLISECONDS_IN_A_SECOND = 1000;

// Converts an optional seconds query param to milliseconds, falling back when absent or invalid.
function secondsParamToMs(value: unknown, fallbackMs: number): number {
  if (typeof value !== "string" || value === "") {
    return fallbackMs;
  }
  const seconds = Number(value);
  if (Number.isNaN(seconds)) {
    return fallbackMs;
  }
  return seconds * MILLISECONDS_IN_A_SECOND;
}

// Allows E2E tests to exercise office filtering by overriding the seeded office codes.
function parseOfficeAccountsQueryParam(value: unknown): string[] {
  if (typeof value !== "string") {
    return ["A001B", "A002B"];
  }
  return value
    .split(",")
    .map((officeCode) => officeCode.trim())
    .filter((officeCode) => officeCode !== "");
}

function parseRolesQueryParam(value: unknown): ProviderRole[] {
  if (value === "application") {
    return [APP_ROLES.APPLICATION_USER];
  }
  if (value === "claims") {
    return [APP_ROLES.CLAIMS_USER];
  }
  if (value === "none") {
    return [];
  }
  return [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER];
}

// Allows E2E tests to exercise upstream auth/failure handling by seeding a
// sentinel access token the MSW handlers recognise.
function resolveAccessToken(value: unknown): string {
  if (typeof value === "string" && value !== "") {
    return value;
  }
  return "test-access-token";
}

export function createAuthRouter(
  authRouter: Router,
  authAdaptor: AuthAdaptor,
): Router {
  authRouter.get(
    "/login",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await authAdaptor.login(req, res);
      } catch (err: unknown) {
        next(err);
      }
    },
  );

  authRouter.get(
    "/callback",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await authAdaptor.callback(req, res);
      } catch (err: unknown) {
        next(err);
      }
    },
  );

  authRouter.get(
    "/logout",
    (req: Request, res: Response, next: NextFunction): void => {
      authAdaptor.logout(req, res, next);
    },
  );

  // Test-only login endpoint that seeds a session without hitting Entra ID.
  // Never mounted outside the test environment.
  if (process.env.NODE_ENV === "test") {
    authRouter.get("/test-login", (req: Request, res: Response): void => {
      req.session.user = {
        name: "External Test [LAA]",
      };
      req.session.accessToken = resolveAccessToken(req.query.accessToken);
      req.session.userId = "test-provider";
      req.session.firmId = "123";
      req.session.firmName = "Test Firm";
      req.session.userOfficeAccounts = parseOfficeAccountsQueryParam(
        req.query.officeAccounts,
      );
      req.session.providerEmail = "test@example.com";
      req.session.roles = parseRolesQueryParam(req.query.role);

      // Optional overrides to exercise session-expiry behaviour in E2E tests.
      const now = Date.now();
      const absoluteTimeoutMs = secondsParamToMs(
        req.query.absoluteSeconds,
        SESSION_ABSOLUTE_TIMEOUT_MS,
      );
      const tokenExpiryMs = secondsParamToMs(
        req.query.tokenExpirySeconds,
        absoluteTimeoutMs + SESSION_EXPIRY_BUFFER_MS,
      );
      startSessionLifetime(req.session, new Date(now + tokenExpiryMs), now, {
        idleTimeoutMs: secondsParamToMs(
          req.query.idleSeconds,
          SESSION_IDLE_TIMEOUT_MS,
        ),
        absoluteTimeoutMs,
      });

      logSessionCreated(req, "auth_route", "test");
      res.redirect("/");
    });
  }

  return authRouter;
}
