import type { Page } from "playwright-core";
import { test, expect } from "#tests/playwright/fixtures/index.js";

const clientDeclarationPage = "/apply/confirmation/client-declaration";
const declarationCheckboxLabel =
  "I confirm the above is correct and that I'll get a signed declaration from my client";

async function submitWithMockStatus(
  page: Page,
  status: 400 | 404 | 500,
): Promise<void> {
  await page.request.get("/test/reset-mock-submit-status");
  await page.request.get(`/test/mock-submit-status/${status}`);
  await page.request.get("/test/seed-confirmation-session");

  await page.goto(clientDeclarationPage);
  const form = page.getByTestId("client-declaration-form");

  await form
    .getByRole("checkbox", {
      name: declarationCheckboxLabel,
    })
    .check();

  await form.getByRole("button", { name: "Continue" }).click();
  await page.waitForLoadState("domcontentloaded");
}

test.describe("Submit application error pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.get("/test/reset-mock-submit-status");
  });

  test.afterEach(async ({ page }) => {
    await page.request.get("/test/reset-mock-submit-status");
  });

  test("renders shared error page for upstream 400 on submit", async ({
    page,
  }) => {
    await submitWithMockStatus(page, 400);

    await expect(
      page.getByRole("heading", { level: 1, name: "400" }),
    ).toBeVisible();
    await expect(
      page.getByText("Mock submit failed with status 400"),
    ).toBeVisible();
  });

  test("renders shared error page for upstream 404 on submit", async ({
    page,
  }) => {
    await submitWithMockStatus(page, 404);

    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
    await expect(
      page.getByText("The page you are looking for could not be found."),
    ).toBeVisible();
  });

  test("renders shared error page for upstream 500 on submit", async ({
    page,
  }) => {
    await submitWithMockStatus(page, 500);

    await expect(
      page.getByRole("heading", { level: 1, name: "500" }),
    ).toBeVisible();
    await expect(
      page.getByText("Mock submit failed with status 500"),
    ).toBeVisible();
  });
});
