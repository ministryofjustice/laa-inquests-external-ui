import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - case search results", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim/results");
  });

  test("renders back link to case search", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Which case do you want to make a claim for?",
      }),
    ).toBeVisible();
  });

  test("renders results table with correct column headings", async ({
    page,
  }) => {
    const table = page.getByRole("table");

    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Case Reference" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Client Name" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Client Date of Birth" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Date Submitted" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Firm Name" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Firm Number" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Case Status" }),
    ).toBeVisible();
  });
});
