import type { NextFunction, Request, Response } from "express";
import {
  APP_ROLES,
  type AppRole,
} from "#src/infrastructure/config/accessControl.js";

/**
 * Exposes the authenticated user's normalised roles to views.
 *
 * Reads only the roles already stored on the session (never token or raw claim
 * data) and makes them available to templates as:
 * - `userRoles`: the user's roles,
 * - `hasRole(role)`: a predicate for conditional rendering,
 * - `appRoles`: the recognised role constants, so templates avoid hardcoding
 *   role display-name strings.
 */
export const viewContext = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const roles: AppRole[] = req.session.roles ?? [];

  res.locals.userRoles = roles;
  res.locals.appRoles = APP_ROLES;
  res.locals.hasRole = (role: AppRole): boolean => roles.includes(role);

  next();
};
