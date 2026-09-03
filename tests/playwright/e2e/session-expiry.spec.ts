import { expect, test } from "@playwright/test";

const BUFFER_SECONDS = 60;
const EFFECTIVE_SECONDS = 2;
const MILLISECONDS_IN_A_SECOND = 1000;

test.describe("Session expiry", () => {
  test("redirects to the login page once the session cookie has expired", async ({
    page,
  }) => {
    // Stub the Entra login page so we don't load the real external URL.
    await page.route(/login\.microsoftonline\.com/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "entra-login-stub",
      }),
    );

    // Re-seed the hardcoded test session (as auth.setup does) but with a short expiry.
    await page.goto(
      `/auth/test-login?tokenExpirySeconds=${BUFFER_SECONDS + EFFECTIVE_SECONDS}`,
    );
    await page.waitForURL("/");
    await expect(page).toHaveTitle(/Inquests/);

    await page.waitForTimeout(
      (EFFECTIVE_SECONDS + 1) * MILLISECONDS_IN_A_SECOND,
    );

    await page.goto("/apply");

    expect(page.url()).toContain("login.microsoftonline.com");
  });
});
