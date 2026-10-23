import { expect, test } from "#tests/playwright/fixtures/index.js";
import { HTTP_BAD_REQUEST } from "#src/infrastructure/locales/constants.js";

const invalidCallbacks = [
  { description: "the auth code is missing", query: "" },
  { description: "the auth code is empty", query: "?code=" },
  {
    description: "the identity provider returns an OAuth error",
    query: "?error=access_denied",
  },
  {
    description: "the identity provider returns an unrecognised error",
    query: "?error=unrecognised-error",
  },
];

test.describe("Invalid authentication callbacks", () => {
  for (const { description, query } of invalidCallbacks) {
    test(`renders an accessible 400 page when ${description}`, async ({
      page,
      checkAccessibility,
    }) => {
      const response = await page.goto(`/auth/callback${query}`);

      expect(response?.status()).toBe(HTTP_BAD_REQUEST);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        String(HTTP_BAD_REQUEST),
      );
      await checkAccessibility();
    });
  }
});
