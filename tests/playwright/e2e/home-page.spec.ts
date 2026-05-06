import { test, expect } from "../fixtures/index.js";

test("homepage should have the correct title", async ({ page }) => {
  // Navigate to the homepage
  await page.goto("/");

  // Check for the title of the application
  await expect(page).toHaveTitle(/Inquests – GOV.UK/);
});

test("homepage should display MoJ header with organisation and service name", async ({
  page,
}) => {
  await page.goto("/");

  // Check for the header with LAA branding
  const mojHeader = page.getByRole("banner").first();
  await expect(mojHeader).toBeVisible();

  // Check for GOV.UK branding which is typically in the header
  await expect(mojHeader.getByRole("link", { name: "Inquests" })).toBeVisible();
  await expect(
    mojHeader.getByRole("link", { name: "Legal Aid Agency" }),
  ).toBeVisible();
  await expect(mojHeader.getByRole("link", { name: "Sign out" })).toBeVisible();
});

test.skip("displays apply button linking to apply journey", async ({ page }) => {
  await page.goto("/");

  const applyButton = page.getByRole("button", { name: "Apply" });
  await expect(applyButton).toBeVisible();
  await expect(applyButton).toHaveAttribute("href", "/apply");

  // Run accessibility check
  // await checkAccessibility();
});
