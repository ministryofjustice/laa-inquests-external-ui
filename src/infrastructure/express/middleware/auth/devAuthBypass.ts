import type { NextFunction, Request, Response } from "express";
import { APP_ROLES } from "#src/infrastructure/config/accessControl.js";

const DEV_SESSION_DATA = {
  userId: "dev-user-id",
  user: { name: "Developer User" },
  firmId: "123",
  officeId: "A001B",
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

  Object.assign(req.session, DEV_SESSION_DATA);

  const { locals } = res;
  const { user } = DEV_SESSION_DATA;
  const { name } = user;
  locals.userName = name;
  next();
};
