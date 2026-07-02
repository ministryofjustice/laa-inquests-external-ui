# Option E — Real Entra Auth in UI E2E: Implementation Plan

## Revision 4 — TOTP browser login, mock auth fully removed

Reference implementation: [iamguidozam.blog](https://iamguidozam.blog/2025/12/17/automate-microsoft-mfa-login-using-playwright/) / [GuidoZam/espc-spfx-session-demo mfa-support branch](https://github.com/GuidoZam/espc-spfx-session-demo/blob/mfa-support/tests/mfa.setup.ts)

---

## Executive Summary

- The current E2E suite runs entirely against a **mock OAuth server**; `NODE_ENV=test` routes all auth through `MockAuthAdaptor` and seeds sessions with a hard-coded fake token. No real Entra token is ever used.
- **The mock auth path is deleted entirely.** `MockAuthAdaptor`, the mock OAuth server, the `test.router.ts` session seeder, and the `seedAuthSession` fixture are all removed. This also closes the `/test/auth-session` session-hijack vector.
- Option E uses a **real browser login flow with TOTP** (time-based one-time password) via `otpauth`. This works with MFA-enabled accounts and requires no special Entra app registration grants.
- A Playwright **`setup` project** (`mfa.setup.ts`) logs in once via the real Microsoft login page, generates the TOTP code programmatically, and saves the browser `storageState` to a file that all subsequent tests reuse.
- `createAuthSource()` in `routes/index.ts` is simplified — it always returns `EntraAuthAdaptor`. The `NODE_ENV=test` branch is removed.
- The **API is a hard dependency**: the API container must be configured with real Entra token validation for Option E to prove auth. That work lives in the API repo.
- New dependency required: **`otpauth`** npm package. Must be installed by the team before implementation — do not install without approval.
- New secrets required: **`E2E_PROVIDER_USERNAME`**, **`E2E_PROVIDER_PASSWORD`**, **`E2E_PROVIDER_MFA_TOTP_SECRET`**.

---

## 1. Current-State Analysis

### 1.1 Auth handling in the UI

| Concern                 | File                                                                 | Detail                                                                                                          |
| ----------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Auth source selection   | `src/infrastructure/express/routes/index.ts:56-74`                   | `NODE_ENV=test` → `MockAuthAdaptor`; otherwise `EntraAuthAdaptor` wrapping MSAL `ConfidentialClientApplication` |
| Login / callback        | `src/adaptors/presenters/auth/Auth.adaptor.ts`                       | `GET /auth/login` redirects to Entra auth URL; `GET /auth/callback` exchanges code for token                    |
| Token storage           | `src/infrastructure/express/middleware/index.ts` + `config.ts:82-92` | Server-side `express-session`; fields: `userId`, `firmCode`, `officeId`, `providerEmail`, `accessToken`, `user` |
| Auth header injection   | `src/infrastructure/express/middleware/axios/index.ts:92-108`        | Request interceptor calls `authService.getAuthHeader()` → `Authorization: Bearer <token>`                       |
| Auth gate               | `src/infrastructure/express/middleware/auth/requireAuth.ts`          | Session presence check only                                                                                     |
| Dev bypass              | `src/infrastructure/express/middleware/auth/devAuthBypass.ts`        | Enabled by `DEV_SKIP_AUTH=true` in `development` only                                                           |
| Custom claims extracted | `EntraAuthAdaptor.ts:54-78`                                          | `FIRM_CODE` → `firmCode`; `ACCOUNTS` → `officeId`                                                               |

### 1.2 Current E2E setup

| Concern             | Detail                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework           | Playwright (`@playwright/test`)                                                                                        |
| Config              | `tests/playwright/playwright.config.ts`                                                                                |
| Test root           | `tests/playwright/e2e/`                                                                                                |
| Auth fixture        | `tests/playwright/fixtures/index.ts` — `seedAuthSession` auto-fixture calls `GET /test/auth-session` before every test |
| Session seeder      | `src/infrastructure/express/routes/test.router.ts` — hard-codes `accessToken: "mock-access-token"`                     |
| Mock OAuth server   | `tests/playwright/factories/mockOAuthServer.ts` — runs on `:4001`                                                      |
| API base URL        | `TEST_CONFIG.INQUESTS_API_URL` defaulting to UAT URL; overridden in CI to `http://127.0.0.1:8027`                      |
| Existing auth tests | `tests/playwright/e2e/auth/auth.spec.ts` — login flow, logout, unauthenticated redirect                                |

### 1.3 CI workflows

| File                                             | Purpose                                                   | Runs E2E?                    |
| ------------------------------------------------ | --------------------------------------------------------- | ---------------------------- |
| `.github/workflows/ci.yaml`                      | Main CI — calls reusable workflows                        | Yes (calls `e2e-tests.yaml`) |
| `.github/workflows/e2e-tests.yaml`               | Playwright E2E — spins up Postgres + API Docker container | **Yes**                      |
| `.github/workflows/unit-tests.yaml`              | Mocha unit tests + coverage                               | No                           |
| `.github/workflows/deploy-uat.yaml`              | Deploy to UAT                                             | No                           |
| `.github/workflows/deploy-staging-and-prod.yaml` | Tag-triggered prod deploy                                 | No                           |
| `.github/workflows/delete-uat-release.yaml`      | Cleans up UAT on PR close                                 | No                           |
| `.github/workflows/dependency-review.yaml`       | Dependency review on PRs                                  | No                           |

**Key CI observation:** `e2e-tests.yaml` starts the real API container but passes `SECRET_KEY=TEST_KEY` with no `AUTH_*` env vars — the API does not validate tokens today.

---

## 2. Proposed Changes

### 2.1 New dependency (install first, with team approval)

```bash
yarn add otpauth
```

### 2.2 File-by-file implementation plan

| #   | File                                               | Change                                                                                                                                                      | Must-have?   |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | `src/adaptors/source/auth/MockAuth.adaptor.ts`     | **Delete**                                                                                                                                                  | **Must**     |
| 2   | `tests/playwright/factories/mockOAuthServer.ts`    | **Delete** (and any MSW auth handlers referencing it)                                                                                                       | **Must**     |
| 3   | `src/infrastructure/express/routes/test.router.ts` | **Delete**                                                                                                                                                  | **Must**     |
| 4   | `src/infrastructure/express/routes/index.ts`       | Remove `NODE_ENV=test` branch from `createAuthSource()`; remove test router mount; always return `EntraAuthAdaptor`                                         | **Must**     |
| 5   | `tests/playwright/fixtures/index.ts`               | Remove `seedAuthSession` auto-fixture entirely                                                                                                              | **Must**     |
| 6   | `tests/playwright/playwright.config.ts`            | Remove mock OAuth env vars; always pass real Entra env vars to `webServer.env`; add `setup` project for TOTP login; add `storageState` to main test project | **Must**     |
| 7   | `tests/playwright/setup/mfa.setup.ts` _(new)_      | Setup project: browser login → fill email/password → generate TOTP via `otpauth` → fill code → save `storageState`                                          | **Must**     |
| 8   | `tests/playwright/constants/AuthFile.ts` _(new)_   | Constant for `storageState` file path                                                                                                                       | **Must**     |
| 9   | `tests/playwright/e2e/auth/auth.spec.ts`           | Update login redirect assertion to target real Entra URL                                                                                                    | **Must**     |
| 10  | `.github/workflows/e2e-tests.yaml`                 | Add `AUTH_*` and `E2E_PROVIDER_*` secrets; create `.auth/` dir before test run                                                                              | **Must**     |
| 11  | `.env.example`                                     | Document all new `E2E_*` vars including `E2E_PROVIDER_MFA_TOTP_SECRET`; remove `MOCK_OAUTH_URL`                                                             | **Must**     |
| 12  | `.gitignore`                                       | Add `tests/playwright/.auth/` — never commit live session state files                                                                                       | **Must**     |
| 13  | `src/infrastructure/config/config.ts`              | Remove `MOCK_OAUTH_URL` from config if no longer needed                                                                                                     | Nice-to-have |

---

## 3. Code Sketches

### 3.1 Simplified `createAuthSource()` — `src/infrastructure/express/routes/index.ts`

The `NODE_ENV=test` branch and mock import are gone. The function always returns `EntraAuthAdaptor`.

```typescript
// Before
function createAuthSource(): EntraAuthAdaptor | MockAuthAdaptor {
  if (process.env.NODE_ENV === "test") {
    return new MockAuthAdaptor(config.MOCK_OAUTH_URL ?? "http://localhost:4001");
  }
  const entraClient = new ConfidentialClientApplication({ ... });
  return new EntraAuthAdaptor(entraClient, config.AUTH_TOKEN_DEBUG_ENABLED, appInfo);
}

// After
function createAuthSource(): EntraAuthAdaptor {
  const entraClient = new ConfidentialClientApplication({
    auth: {
      clientId: config.AUTH_CLIENT_ID,
      authority: config.AUTH_DIRECTORY_URL,
      clientSecret: config.AUTH_CLIENT_SECRET,
    },
  });
  return new EntraAuthAdaptor(entraClient, config.AUTH_TOKEN_DEBUG_ENABLED, appInfo);
}
```

Also remove:

```typescript
// Delete this block entirely
if (process.env.NODE_ENV === "test") {
  indexRouter.use("/", createTestRouter(express.Router()));
}
```

### 3.2 TOTP setup project — `tests/playwright/setup/mfa.setup.ts`

Directly follows the [reference implementation](https://github.com/GuidoZam/espc-spfx-session-demo/blob/mfa-support/tests/mfa.setup.ts), adapted for this project's login URL.

```typescript
import { test as setup } from "@playwright/test";
import * as OTPAuth from "otpauth";
import { AUTH_FILE } from "../constants/AuthFile.js";

setup("authenticate as provider", async ({ page }) => {
  // 1. Trigger login — UI redirects to real Entra login page
  await page.goto("/auth/login");

  // 2. Fill email
  const emailInput = page.locator("input[type=email]");
  await emailInput.waitFor();
  await emailInput.fill(process.env.E2E_PROVIDER_USERNAME ?? "");
  await page.getByRole("button", { name: "Next" }).click();

  // 3. Fill password
  const passwordInput = page.locator("input[type=password]");
  await passwordInput.waitFor();
  await passwordInput.fill(process.env.E2E_PROVIDER_PASSWORD ?? "");
  await page.locator("input[type=submit]").click();

  // 4. Generate and fill TOTP code
  const totp = new OTPAuth.TOTP({
    issuer: "Microsoft",
    label: process.env.E2E_PROVIDER_USERNAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: process.env.E2E_PROVIDER_MFA_TOTP_SECRET,
  });

  const otpInput = await page.waitForSelector("input#idTxtBx_SAOTCC_OTC");
  await otpInput.fill(totp.generate());
  await page.locator("input[type=submit]").click();

  // 5. Stay signed in
  const yesButton = page.locator("input[type=submit][value='Yes']");
  await yesButton.waitFor();
  await yesButton.click();

  // 6. Wait until back on the UI (Entra callback → home)
  await page.waitForURL("/");

  await page.context().storageState({ path: AUTH_FILE });
});
```

### 3.3 Auth file constant — `tests/playwright/constants/AuthFile.ts`

```typescript
export const AUTH_FILE = "tests/playwright/.auth/provider.json" as const;
```

### 3.4 Updated `playwright.config.ts`

No more branching — always real Entra.

```typescript
import { defineConfig, devices } from "@playwright/test";
import { AUTH_FILE } from "./constants/AuthFile.js";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI === "true" ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: process.env.CI === "true" ? "on" : "on-first-retry",
  },

  projects: [
    // Setup project runs first — logs in and saves storageState
    {
      name: "setup",
      testMatch: /mfa\.setup\.ts/,
      testDir: "./setup",
    },
    // Main test suite reuses the saved session
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "yarn tsx tests/playwright/factories/handlers/testMsw.js",
    url: "http://localhost:3000/status",
    reuseExistingServer: false,
    cwd: "../..",
    env: {
      NODE_ENV: "test",
      PORT: "3000",
      SESSION_SECRET: process.env.SESSION_SECRET ?? "test-secret",
      SESSION_NAME: "test-session",
      SERVICE_NAME: "Inquests",
      AUTH_DIRECTORY_URL: process.env.AUTH_DIRECTORY_URL ?? "",
      AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID ?? "",
      AUTH_CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET ?? "",
      AUTH_REDIRECT_URI: "http://localhost:3000/auth/callback",
      AUTH_POST_LOGOUT_URI: "http://localhost:3000",
      INQUESTS_API_CLIENT_ID: process.env.INQUESTS_API_CLIENT_ID ?? "",
      INQUESTS_API_URL: process.env.INQUESTS_API_URL ?? "",
    },
  },
});
```

### 3.5 Updated fixtures — `tests/playwright/fixtures/index.ts`

`seedAuthSession` is gone. Session is established by `storageState` at the project level.

```typescript
import { test as base, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "#tests/playwright/fixtures/pages/PageFactory.js";

interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
}

export const test = base.extend<TestFixtures>({
  checkAccessibility: async ({ page }, use): Promise<void> => {
    const checkAccessibility = async (): Promise<void> => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag22a"])
        .analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    };
    await use(checkAccessibility);
  },

  pages: async ({ page }, use): Promise<void> => {
    await use(new PageFactory(page));
  },
});

export { expect } from "@playwright/test";
```

### 3.6 `.gitignore` addition

```
# Playwright auth state — never commit real session files
tests/playwright/.auth/
```

---

## 4. Local Developer Runbook

### 4.0 One-time account setup (done in the browser)

1. Sign into the provider test account at https://mysignins.microsoft.com/security-info
2. Click **Add sign-in method** → **Microsoft Authenticator** → **Add**
3. Click **Set up a different authenticator app** → **Next**
4. Click **Can't scan the QR code?**
5. Copy the **Secret key** — this is your `E2E_PROVIDER_MFA_TOTP_SECRET`. Store it immediately in `.env.external` and as a GitHub Actions secret. Do not share it.

### 4.1 Required env vars (add to `.env.external`)

```
AUTH_DIRECTORY_URL=https://login.microsoftonline.com/<tenant-id>
AUTH_CLIENT_ID=<ui-app-client-id>
AUTH_CLIENT_SECRET=<ui-app-client-secret>
INQUESTS_API_CLIENT_ID=<api-app-client-id>
INQUESTS_API_URL=http://localhost:8027

E2E_PROVIDER_USERNAME=provider-test@<tenant>.onmicrosoft.com
E2E_PROVIDER_PASSWORD=<secret>
E2E_PROVIDER_MFA_TOTP_SECRET=<secret-key-from-step-5-above>

SESSION_SECRET=local-dev-secret
SESSION_NAME=sessionId
NODE_ENV=test
```

### 4.2 Steps

```bash
# 1. Install new dependency (once, after team approval)
yarn add otpauth

# 2. Create .auth directory (gitignored — must exist before Playwright runs)
mkdir -p tests/playwright/.auth

# 3. Start the API locally with real Entra token validation
cd ../laa-inquests-api && docker compose up -d

# 4. Run E2E suite
yarn test:e2e
```

The `setup` project runs automatically first. It opens Chromium, navigates to `/auth/login`, completes the Microsoft login form including TOTP, and saves `storageState` to `.auth/provider.json`. All subsequent tests load that file and are already authenticated.

### 4.3 Expected failure modes

| Failure                                           | Symptom                                       | Mitigation                                                                                       |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Wrong TOTP secret                                 | Login fails at MFA step — "incorrect code"    | Re-copy secret key from Microsoft Security Info; ensure no spaces in the value                   |
| TOTP code expires during fill (30s boundary)      | Login fails intermittently                    | Add a retry in `mfa.setup.ts`: if the submit after OTP fails, wait 5s, regenerate and retry once |
| TOTP authenticator not configured on test account | No MFA prompt appears                         | Verify the authenticator app method is registered in Security Info                               |
| Bad username or password                          | Login fails before TOTP step                  | Verify credentials; check account is not locked in Entra admin portal                            |
| Entra service outage                              | Setup project navigation hangs then times out | Suite fails fast at the setup stage — check Azure status page                                    |
| API not validating tokens                         | Tests pass regardless of token                | Confirm `AUTH_ENABLED=true` on the API container                                                 |
| `.auth/` files committed                          | Live session tokens in version control        | Confirm `.gitignore` entry exists before the first run                                           |

---

## 5. CI/CD Runbook

### 5.1 Required GitHub Actions secrets

```
AUTH_DIRECTORY_URL
AUTH_CLIENT_ID
AUTH_CLIENT_SECRET
INQUESTS_API_CLIENT_ID
E2E_PROVIDER_USERNAME
E2E_PROVIDER_PASSWORD
E2E_PROVIDER_MFA_TOTP_SECRET
```

### 5.2 Workflow changes — `.github/workflows/e2e-tests.yaml`

```yaml
- name: Create auth state directory
  run: mkdir -p tests/playwright/.auth

- name: Run Playwright tests
  run: yarn test:e2e
  env:
    CI: true
    NODE_ENV: test
    SESSION_SECRET: "playwright-test-secret"
    SESSION_NAME: "sessionId"
    INQUESTS_API_URL: "http://127.0.0.1:8027"
    AUTH_DIRECTORY_URL: ${{ secrets.AUTH_DIRECTORY_URL }}
    AUTH_CLIENT_ID: ${{ secrets.AUTH_CLIENT_ID }}
    AUTH_CLIENT_SECRET: ${{ secrets.AUTH_CLIENT_SECRET }}
    INQUESTS_API_CLIENT_ID: ${{ secrets.INQUESTS_API_CLIENT_ID }}
    E2E_PROVIDER_USERNAME: ${{ secrets.E2E_PROVIDER_USERNAME }}
    E2E_PROVIDER_PASSWORD: ${{ secrets.E2E_PROVIDER_PASSWORD }}
    E2E_PROVIDER_MFA_TOTP_SECRET: ${{ secrets.E2E_PROVIDER_MFA_TOTP_SECRET }}
```

Also update the `Start API container` step to pass `AUTH_*` env vars so it validates real tokens.

### 5.3 Retry / backoff

- Playwright already retries 2× in CI (`retries: 2`)
- The `setup` project runs once before the suite — if it fails the job fails immediately with a clear message before any test wastes time
- `storageState` is created once per CI run; the ~60 min session lifetime covers a normal suite
- Keep `workers: 1`

---

## 6. Test Impact and Coverage

### 6.1 Tests needing updates

| Test file                                                             | Change needed                                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `tests/playwright/e2e/auth/auth.spec.ts`                              | Remove reference to `MOCK_OAUTH_URL`; login redirect assertion must target `login.microsoftonline.com` |
| `tests/playwright/fixtures/index.ts`                                  | Remove `seedAuthSession` fixture                                                                       |
| Any test that calls `page.request.get("/test/auth-session")` directly | Remove the call — the route no longer exists                                                           |

### 6.2 New E2E cases to add

| Test                                           | Purpose                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| Provider TOTP login → reaches home page        | Proves full browser login + TOTP flow works end-to-end |
| Provider submits application → API returns 201 | Proves real Bearer token accepted by API               |
| Expired/invalid token → redirected to login    | Proves 401 handling in UI middleware                   |
| Logout clears session                          | Proves session teardown works with real tokens         |

### 6.3 Out of scope

- MFA prompt UX beyond TOTP (push notifications, SMS)
- Entra tenant configuration testing (CA policy changes, group membership)
- Token refresh / silent renewal flows
- Mock OAuth server behaviour (deleted)

---

## 7. Risks and Controls

| #   | Risk                                                                                                | Severity | Control                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **TOTP secret leakage** — the secret key grants permanent MFA bypass if stolen                      | High     | Store only in GitHub Actions secrets and local `.env.external` (gitignored); never log or echo it; rotate immediately if compromised |
| 2   | **`storageState` file committed to git** — contains live session tokens                             | High     | Add `tests/playwright/.auth/` to `.gitignore` before first run; add a CI check that the directory is absent from the repo            |
| 3   | **TOTP code expiry at 30s boundary** — code generated 1 second before rollover causes login failure | Medium   | One-time retry in `mfa.setup.ts`: if OTP submit fails, wait 5s, regenerate, retry                                                    |
| 4   | **Test user password or TOTP secret rotation breaks CI**                                            | Medium   | Quarterly rotation calendar reminder; update CI secret at the same time as the account password                                      |
| 5   | **Tenancy drift** — API Entra scopes or custom claim names (`FIRM_CODE`, `ACCOUNTS`) change         | Medium   | Run Option E suite nightly against UAT so drift is caught before production                                                          |

---

## 8. Open Questions / Assumptions

1. **Does the API currently validate Entra tokens?** CI starts it with `SECRET_KEY=TEST_KEY` and no `AUTH_*` config. Option E has no value unless the API enforces real token validation — confirm with the API team before starting implementation.
2. **What claims does the provider test account carry?** The UI reads `FIRM_CODE` and `ACCOUNTS` custom claims. The provider test account must be provisioned with these in the Entra test tenant.
3. **Dedicated test tenant vs shared tenant?** Logging into the production Entra tenant with test accounts during CI is risky. A dedicated E2E sandbox app registration is strongly preferred.
4. **Entra login page selector stability** — `input#idTxtBx_SAOTCC_OTC` is from the reference implementation but Microsoft occasionally updates their login UI. If it breaks, use a broader `waitForSelector` and log the page title on failure to distinguish a UI change from a product regression.
5. **`otpauth` package approval** — do not install without team sign-off per project convention.
