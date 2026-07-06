import type { NextFunction, Request, Response } from "express";

const DEV_SESSION_DATA = {
  userId: "dev-user-id",
  user: { name: "Developer User" },
  firmCode: "0A123B",
  officeId: "001",
  providerEmail: "developer@example.com",
  accessToken: "dev-access-token",
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
