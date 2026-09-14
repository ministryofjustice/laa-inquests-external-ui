import { strict as assert } from "assert";
import {
  APP_ROLES,
  RECOGNISED_ROLES,
  isRecognisedRole,
  normaliseRoles,
  matchesPrefix,
  isPublicPath,
  findRoutePolicy,
  hasAllowedRole,
} from "#src/infrastructure/config/accessControl.js";

describe("accessControl config", () => {
  describe("RECOGNISED_ROLES", () => {
    it("contains exactly the two provider roles", () => {
      assert.deepEqual(
        [...RECOGNISED_ROLES],
        [
          "Inquests - Provider Application User",
          "Inquests - Provider Claims User",
        ],
      );
    });
  });

  describe("isRecognisedRole", () => {
    it("returns true for a recognised role", () => {
      assert.equal(isRecognisedRole(APP_ROLES.APPLICATION_USER), true);
    });

    it("returns false for an unknown role", () => {
      assert.equal(isRecognisedRole("Inquests - Random Role"), false);
    });

    it("returns false for non-string values", () => {
      assert.equal(isRecognisedRole(undefined), false);
      assert.equal(isRecognisedRole(null), false);
      assert.equal(isRecognisedRole(42), false);
      assert.equal(isRecognisedRole({}), false);
    });
  });

  describe("normaliseRoles", () => {
    it("keeps only recognised roles", () => {
      const result = normaliseRoles([
        APP_ROLES.APPLICATION_USER,
        "Inquests - Random Role",
        APP_ROLES.CLAIMS_USER,
      ]);

      assert.deepEqual(result, [
        APP_ROLES.APPLICATION_USER,
        APP_ROLES.CLAIMS_USER,
      ]);
    });

    it("deduplicates repeated roles", () => {
      const result = normaliseRoles([
        APP_ROLES.APPLICATION_USER,
        APP_ROLES.APPLICATION_USER,
      ]);

      assert.deepEqual(result, [APP_ROLES.APPLICATION_USER]);
    });

    it("ignores malformed values", () => {
      const result = normaliseRoles([
        undefined,
        null,
        42,
        {},
        APP_ROLES.CLAIMS_USER,
      ]);

      assert.deepEqual(result, [APP_ROLES.CLAIMS_USER]);
    });

    it("returns an empty array when no recognised role is present", () => {
      assert.deepEqual(normaliseRoles(["Unknown", ""]), []);
    });
  });

  describe("matchesPrefix", () => {
    it("matches the exact prefix", () => {
      assert.equal(matchesPrefix("/apply", "/apply"), true);
    });

    it("matches nested segments under the prefix", () => {
      assert.equal(matchesPrefix("/apply/client-details/name", "/apply"), true);
    });

    it("does not match a different route sharing the prefix text", () => {
      assert.equal(matchesPrefix("/application", "/apply"), false);
    });

    it("matches the root prefix only for the exact root path", () => {
      assert.equal(matchesPrefix("/", "/"), true);
      assert.equal(matchesPrefix("/apply", "/"), false);
    });
  });

  describe("isPublicPath", () => {
    it("treats health and status as public", () => {
      assert.equal(isPublicPath("/health"), true);
      assert.equal(isPublicPath("/status"), true);
    });

    it("treats the error page as public", () => {
      assert.equal(isPublicPath("/error"), true);
    });

    it("treats all auth bootstrap routes as public", () => {
      assert.equal(isPublicPath("/auth/login"), true);
      assert.equal(isPublicPath("/auth/callback"), true);
      assert.equal(isPublicPath("/auth/logout"), true);
      assert.equal(isPublicPath("/auth/test-login"), true);
    });

    it("does not treat protected pages as public", () => {
      assert.equal(isPublicPath("/"), false);
      assert.equal(isPublicPath("/apply"), false);
      assert.equal(isPublicPath("/claim"), false);
    });
  });

  describe("findRoutePolicy", () => {
    it("matches /apply to the application-user policy", () => {
      const policy = findRoutePolicy("/apply/upload-coroners-letter");

      assert.deepEqual(policy?.allowedRoles, [APP_ROLES.APPLICATION_USER]);
    });

    it("matches /claim to the claims-user policy", () => {
      const policy = findRoutePolicy("/claim/evidence");

      assert.deepEqual(policy?.allowedRoles, [APP_ROLES.CLAIMS_USER]);
    });

    it("matches the home page to both roles", () => {
      const policy = findRoutePolicy("/");

      assert.deepEqual(policy?.allowedRoles, [
        APP_ROLES.APPLICATION_USER,
        APP_ROLES.CLAIMS_USER,
      ]);
    });

    it("returns undefined for an unconfigured route", () => {
      assert.equal(findRoutePolicy("/random-page"), undefined);
      assert.equal(findRoutePolicy("/application"), undefined);
    });
  });

  describe("hasAllowedRole", () => {
    const applyPolicy = findRoutePolicy("/apply");

    it("returns true when a user role is permitted", () => {
      assert.ok(applyPolicy);
      assert.equal(
        hasAllowedRole([APP_ROLES.APPLICATION_USER], applyPolicy),
        true,
      );
    });

    it("returns true when any of several roles is permitted", () => {
      assert.ok(applyPolicy);
      assert.equal(
        hasAllowedRole(
          [APP_ROLES.CLAIMS_USER, APP_ROLES.APPLICATION_USER],
          applyPolicy,
        ),
        true,
      );
    });

    it("returns false when no user role is permitted", () => {
      assert.ok(applyPolicy);
      assert.equal(hasAllowedRole([APP_ROLES.CLAIMS_USER], applyPolicy), false);
    });

    it("returns false when the user has no roles", () => {
      assert.ok(applyPolicy);
      assert.equal(hasAllowedRole([], applyPolicy), false);
    });
  });
});
