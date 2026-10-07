import { getEnvironmentVariable } from "@gatling.io/core";
import { decodeJwtPayload } from "./jwt.js";

export function resolveAccessToken(): string {
  const accessToken = getEnvironmentVariable("GATLING_ACCESS_TOKEN");
  if (accessToken == null || accessToken === "") {
    throw new Error(
      "GATLING_ACCESS_TOKEN is not set — copy tests/gatling/.env.example to .env and paste a valid access token.",
    );
  }
  return accessToken;
}

// Office codes the real test account has access to in the Inquests API —
// derived from the access token's ACCOUNTS claim (same claim the real app
// uses, see EntraAuth.adaptor.ts), since /auth/test-login otherwise defaults
// to fixture codes that won't match real API data. GATLING_OFFICE_ACCOUNTS
// can still be set to override this.
export function resolveOfficeAccounts(): string {
  const override = getEnvironmentVariable("GATLING_OFFICE_ACCOUNTS");
  if (override != null && override !== "") {
    return override;
  }

  const claims = decodeJwtPayload(resolveAccessToken());
  const accounts = claims.ACCOUNTS;
  const accountsString = Array.isArray(accounts)
    ? accounts.join(",")
    : typeof accounts === "string"
      ? accounts
      : undefined;

  if (accountsString == null || accountsString === "") {
    throw new Error(
      "Could not determine office accounts from the access token's ACCOUNTS claim. " +
        "Set GATLING_OFFICE_ACCOUNTS in tests/gatling/.env to override.",
    );
  }
  return accountsString;
}

// The firm the real test account belongs to in the Inquests API — derived
// from the access token's FIRM_CODE claim (same claim the real app uses, see
// EntraAuth.adaptor.ts), since /auth/test-login otherwise defaults to a
// fixture firmId that won't match real API data. GATLING_FIRM_ID can still
// be set to override this.
export function resolveFirmId(): string {
  const override = getEnvironmentVariable("GATLING_FIRM_ID");
  if (override != null && override !== "") {
    return override;
  }

  const claims = decodeJwtPayload(resolveAccessToken());
  const firmCode = claims.FIRM_CODE;
  const firmId =
    typeof firmCode === "string" || typeof firmCode === "number"
      ? String(firmCode)
      : undefined;

  if (firmId == null || firmId === "") {
    throw new Error(
      "Could not determine firmId from the access token's FIRM_CODE claim. " +
        "Set GATLING_FIRM_ID in tests/gatling/.env to override.",
    );
  }
  return firmId;
}
