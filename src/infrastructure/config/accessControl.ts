import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

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

export type ProviderRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const RECOGNISED_ROLES: readonly ProviderRole[] =
  Object.values(APP_ROLES);

export const ROLE_CLAIM_KEY = "LAA_APP_ROLES";

export interface RoutePolicy {
  readonly prefix: string;
  readonly allowedRoles: readonly ProviderRole[];
}

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

export function isRecognisedRole(value: unknown): value is ProviderRole {
  return typeof value === "string" && RECOGNISED_ROLES.includes(value);
}

export function normaliseRoles(values: readonly unknown[]): ProviderRole[] {
  const rawRoles: string[] = [];

  for (const value of values) {
    if (typeof value === "string") {
      // Handle comma-separated roles
      const parts = value.split(",");
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed !== "") {
          rawRoles.push(trimmed);
        }
      }
    }
  }

  const recognised: ProviderRole[] = [];
  for (const role of rawRoles) {
    if (!isRecognisedRole(role)) {
      throw new Error(`Unknown role in token claims: "${String(role)}"`);
    }
    recognised.push(role);
  }

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
  userRoles: readonly ProviderRole[],
  policy: RoutePolicy,
): boolean {
  return userRoles.some((role) => policy.allowedRoles.includes(role));
}

export function validateRolesNotEmpty(roles: readonly ProviderRole[]): void {
  if (roles.length === EMPTY_ARR_LENGTH) {
    throw new Error(
      "User has no provider roles assigned. Authentication denied.",
    );
  }
}
