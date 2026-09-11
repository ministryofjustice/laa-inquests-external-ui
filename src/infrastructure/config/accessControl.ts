/**
 * Central role-based access-control (RBAC) configuration.
 *
 * This module is the single source of truth for:
 * - the exact Entra role display names recognised by the service,
 * - the public / infrastructure routes that bypass authorisation,
 * - the page-level route policy matrix used by the global access guard.
 *
 * Adding a new protected top-level route requires adding a policy entry here.
 * Matching is segment-safe: `/apply` and `/apply/...` match the Apply policy,
 * while `/application` does not.
 */

export const APP_ROLES = {
  APPLICATION_USER: "Inquests - Provider Application User",
  CLAIMS_USER: "Inquests - Provider Claims User",
};

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/** The complete set of roles the service recognises. */
export const RECOGNISED_ROLES: readonly AppRole[] = Object.values(APP_ROLES);

export interface RoutePolicy {
  readonly prefix: string;
  readonly allowedRoles: readonly AppRole[];
}

/**
 * Central route policy matrix. Order matters: more specific prefixes must come
 * before the shared `/` entry so that `/apply` and `/claim` are matched first.
 */
export const ROUTE_POLICIES: readonly RoutePolicy[] = [
  { prefix: "/apply", allowedRoles: [APP_ROLES.APPLICATION_USER] },
  { prefix: "/claim", allowedRoles: [APP_ROLES.CLAIMS_USER] },
  {
    prefix: "/",
    allowedRoles: [APP_ROLES.APPLICATION_USER, APP_ROLES.CLAIMS_USER],
  },
];

const PUBLIC_EXACT_PATHS: readonly string[] = ["/health", "/status", "/error"];

const PUBLIC_PREFIXES: readonly string[] = ["/auth"];

export function isRecognisedRole(value: unknown): value is AppRole {
  return typeof value === "string" && RECOGNISED_ROLES.includes(value);
}

/**
 * Normalise arbitrary role claim values into a deduplicated list of recognised
 * roles. Accepts strings and arrays; unknown or malformed values are ignored.
 */
export function normaliseRoles(values: readonly unknown[]): AppRole[] {
  const recognised = values.filter(isRecognisedRole);
  return [...new Set(recognised)];
}

export function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix === "/") {
    return path === "/";
  }
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isPublicPath(path: string): boolean {
  if (PUBLIC_EXACT_PATHS.includes(path)) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

export function findRoutePolicy(path: string): RoutePolicy | undefined {
  return ROUTE_POLICIES.find((policy) => matchesPrefix(path, policy.prefix));
}

export function hasAllowedRole(
  userRoles: readonly AppRole[],
  policy: RoutePolicy,
): boolean {
  return userRoles.some((role) => policy.allowedRoles.includes(role));
}
