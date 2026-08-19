import { test, expect } from "#tests/playwright/fixtures/index.js";

test.describe("Add interested party (public authority)", () => {
  test("renders interested party (public authority) page with checkboxes and continue button", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/apply/public-authority");

    const heading = page.getByRole("heading", {
      name: "Who are the listed interested parties(public authority) on this application?",
    });
    const continueButton = page.getByRole("button");
    const checkboxes = page.getByRole("checkbox");

    await expect(heading).toBeVisible();
    await expect(continueButton).toBeVisible();

    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    await checkAccessibility();
  });

  test("redirects to upload coroner's letter after selecting a single interested party (public authority)", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    const checkboxes = page.getByRole("checkbox");
    await checkboxes.nth(0).check();
    await page.getByRole("button").click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
  });

  test("redirects to upload coroner's letter after selecting multiple interested parties (public authority)", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    const checkboxes = page.getByRole("checkbox");
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await page.getByRole("button").click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
  });

  test("renders validation error when no interested party (public authority) is selected", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    await page.getByRole("button").click();

    const errorMessage = page.getByText(
      "Please select at least one interested party (public authority)",
      {
        exact: true,
      },
    );
    await expect(errorMessage).toBeVisible();
  });
});
