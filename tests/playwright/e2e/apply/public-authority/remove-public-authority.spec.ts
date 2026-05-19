import { test, expect } from "#tests/playwright/fixtures/index.js";

test.describe("Remove public authority", () => {
  test("renders expected public authority page heading and continue button", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");
    await page.getByLabel("Cabinet Office", { exact: true }).check();
    await page.getByRole("button").click();

    await page.goto(
      "/apply/public-authority/remove?publicAuthorityId=cabinet-office",
    );

    const heading = page.getByRole("heading", {
      name: "Are you sure you want to remove this public authority?",
    });

    const continueButton = page.getByRole("button");

    await expect(heading).toBeVisible();
    await expect(continueButton).toBeVisible();
  });

  test("removes a public authority and shows success message on confirmation page", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");
    await page.getByLabel("Cabinet Office", { exact: true }).check();
    await page.getByRole("button").click();

    await page.goto(
      "/apply/public-authority/remove?publicAuthorityId=cabinet-office",
    );

    await page.getByLabel("Yes").check();
    await page.getByRole("button").click();

    await expect(page).toHaveURL("/apply/public-authority/confirmation");

    const successBanner = page.getByRole("heading", { name: "Success" });
    const successMessage = page.getByText("Public authority has been removed");

    await expect(successBanner).toBeVisible();
    await expect(successMessage).toBeVisible();
  });
});
