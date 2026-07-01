import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - case search results", () => {
  test.beforeEach(async ({ page }) => {
    await page.request.get("/test/claim-search-session?laa_reference=1");
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
      table.getByRole("columnheader", { name: "Reference" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Client's name" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Date of birth" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Date submitted" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Firm name and number" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
  });

  test("renders at least one result row", async ({ page }) => {
    const table = page.getByRole("table");
    const rows = table.getByRole("row");

    await expect(rows).toHaveCount(2);
  });
});
