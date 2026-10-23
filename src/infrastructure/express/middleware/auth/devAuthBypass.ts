import type { NextFunction, Request, Response } from "express";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";
import { startSessionLifetime } from "#src/infrastructure/express/session/sessionExpiry.js";
import { logSessionCreated } from "#src/infrastructure/express/session/sessionAudit.js";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_EXPIRY_BUFFER_MS,
} from "#src/infrastructure/locales/constants.js";

const DEV_SESSION_DATA = {
  userId: "dev-user-id",
  user: { name: "Developer User" },
  firmId: "123",
  userOfficeAccounts: ["A001B", "A002B"],
  providerEmail: "developer@example.com",
  accessToken: "dev-access-token",
  roles: [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER],
} as const;

export const seedDevAuthSession = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.session.userId !== undefined) {
    next();
    return;
  }

  const now = Date.now();
  // Credential outlives the absolute cap so the dev session follows the normal idle/absolute rules.
  startSessionLifetime(
    req.session,
    new Date(now + SESSION_ABSOLUTE_TIMEOUT_MS + SESSION_EXPIRY_BUFFER_MS),
    now,
  );
  Object.assign(req.session, DEV_SESSION_DATA);
  logSessionCreated(req, "seed_dev_auth_session", "dev");

  const { locals } = res;
  const { user } = DEV_SESSION_DATA;
  const { name } = user;
  locals.userName = name;
  next();
};
