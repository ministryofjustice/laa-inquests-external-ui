import { expect, test } from "#tests/playwright/fixtures/index.js";
import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

const HTTP_FOUND = 302;
const BUFFER_SECONDS = 60;
const EFFECTIVE_SECONDS = 2;
const MILLISECONDS_IN_A_SECOND = 1000;
const IDLE_SECONDS = 2;
const ABSOLUTE_SECONDS = 4;
const ACTIVITY_INTERVAL_MS = 1000;
const LONG_TOKEN_SECONDS = 3600;

const waitSeconds = async (page: Page, seconds: number): Promise<void> => {
  await page.waitForTimeout(seconds * MILLISECONDS_IN_A_SECOND);
};

// Assert the immediate redirect to the login route without following it to Entra.
const expectLoginRedirect = async (
  request: APIRequestContext,
  cookieHeader?: string,
): Promise<void> => {
  const response = await request.get("/", {
    maxRedirects: 0,
    ...(cookieHeader === undefined
      ? {}
      : { headers: { cookie: cookieHeader } }),
  });
  expect(response.status()).toBe(HTTP_FOUND);
  expect(response.headers().location).toBe("/auth/login");
};

const retainCookieHeader = async (context: BrowserContext): Promise<string> =>
  (await context.cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

// Each journey seeds its own short-lived session rather than reusing the shared one.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Session expiry", () => {
  test("redirects to the login route once the credential has expired", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto(
      `/auth/test-login?tokenExpirySeconds=${BUFFER_SECONDS + EFFECTIVE_SECONDS}`,
    );
    await page.waitForURL("/");
    await expect(page).toHaveTitle(/Inquests/);
    await checkAccessibility();

    await waitSeconds(page, EFFECTIVE_SECONDS + 1);

    await expectLoginRedirect(page.request);
  });

  test("redirects to the login route after the idle timeout", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto(`/auth/test-login?idleSeconds=${IDLE_SECONDS}`);
    await page.waitForURL("/");
    await checkAccessibility();

    await waitSeconds(page, IDLE_SECONDS + 1);

    await expectLoginRedirect(page.request);
  });

  test("redirects to the login route at the absolute timeout despite continuous activity", async ({
    page,
  }) => {
    await page.goto(
      `/auth/test-login?idleSeconds=${IDLE_SECONDS}&absoluteSeconds=${ABSOLUTE_SECONDS}&tokenExpirySeconds=${LONG_TOKEN_SECONDS}`,
    );
    await page.waitForURL("/");

    const deadline = Date.now() + ABSOLUTE_SECONDS * MILLISECONDS_IN_A_SECOND;
    while (Date.now() + ACTIVITY_INTERVAL_MS < deadline) {
      const response = await page.request.get("/", { maxRedirects: 0 });
      expect(response.status()).not.toBe(HTTP_FOUND);
      await page.waitForTimeout(ACTIVITY_INTERVAL_MS);
    }
    await page.waitForTimeout(ACTIVITY_INTERVAL_MS);

    await expectLoginRedirect(page.request);
  });

  test("rejects a retained session cookie replayed after expiry", async ({
    page,
    context,
    request,
  }) => {
    await page.goto(`/auth/test-login?idleSeconds=${IDLE_SECONDS}`);
    await page.waitForURL("/");
    const retainedCookie = await retainCookieHeader(context);

    await waitSeconds(page, IDLE_SECONDS + 1);
    await expectLoginRedirect(page.request);

    await expectLoginRedirect(request, retainedCookie);
  });

  test("rejects a retained session cookie replayed after logout", async ({
    page,
    context,
    request,
  }) => {
    await page.goto("/auth/test-login");
    await page.waitForURL("/");
    const retainedCookie = await retainCookieHeader(context);

    await page.request.get("/auth/logout", { maxRedirects: 0 });

    await expectLoginRedirect(request, retainedCookie);
  });
});
