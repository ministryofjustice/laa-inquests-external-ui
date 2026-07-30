import { test, expect } from "#tests/playwright/fixtures/index.js";

const EXPECTED_PUBLIC_BODIES = [
  "Attorney General's Office",
  "Cabinet Office",
  "Department for Transport",
  "API-only public body",
];

test.describe("Add public authority", () => {
  test("renders expected public authority page heading, public authority options and continue button", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    const heading = page.getByRole("heading", {
      name: "Which public authorities are listed as interested parties?",
    });

    const continueButton = page.getByRole("button");

    await expect(heading).toBeVisible();
    await expect(continueButton).toBeVisible();

    for (const option of EXPECTED_PUBLIC_BODIES) {
      const checkbox = await page.getByLabel(option, {
        exact: true,
      });
      await expect(checkbox).toBeVisible();
    }
  });

  test("redirects to upload coroner's letter after selecting a single public authority", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    await page.getByLabel("Cabinet Office", { exact: true }).check();
    await page.getByRole("button").click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
  });

  test("redirects to upload coroner's letter after selecting multiple public authorities", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    await page.getByLabel("Cabinet Office", { exact: true }).check();
    await page.getByLabel("Attorney General's Office", { exact: true }).check();
    await page.getByRole("button").click();

    await expect(page).toHaveURL("/apply/upload-coroners-letter");
  });

  test("renders validation error when no public authority is selected", async ({
    page,
  }) => {
    await page.goto("/apply/public-authority");

    await page.getByRole("button").click();

    const errorMessage = page.getByText(
      "Please select at least one public authority",
      {
        exact: true,
      },
    );
    await expect(errorMessage).toBeVisible();
  });
});
