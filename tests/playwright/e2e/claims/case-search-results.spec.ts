import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - case search results", () => {
  test.beforeEach(async ({ page }) => {
    console.log("Starting case-search result");
    await page.goto("/claim/search");
    await page
      .getByTestId("case-search-form")
      .getByLabel("Enter the case reference number")
      .fill("INQ-YYY-001");
    await page
      .getByTestId("case-search-form")
      .getByRole("button", { name: "Continue" })
      .click();
    await page.waitForURL("**/claim/results");
  });

  test("renders back link to case search", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/search");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Check the certificate details",
      }),
    ).toBeVisible();
  });

  test("renders results table with correct column headings", async ({
    page,
    checkAccessibility,
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

    await checkAccessibility();
  });

  test("renders at least one result row", async ({ page }) => {
    const table = page.getByRole("table");
    const rows = table.getByRole("row");

    await expect(rows).toHaveCount(2);
  });

  test("renders reference as a link to select the case", async ({ page }) => {
    const firstDataRow = page.getByRole("table").getByRole("row").nth(1);
    const referenceLink = firstDataRow.getByRole("link");

    await expect(referenceLink).toBeVisible();
    await expect(referenceLink).toHaveAttribute(
      "href",
      /\/claim\/results\/select\/.+/,
    );
  });

  test("does not render an error summary when results load normally", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toHaveCount(0);
  });

  test("renders an error summary when the selected case is not in the search results", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/claim/results/select/INQ-NOT-IN-RESULTS");

    await expect(page).toHaveURL(/\/claim\/results\?selectionError=true$/);
    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "There was a problem selecting the case. Select the case again.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);

    await checkAccessibility();
  });

  test("allows the case to be selected again after a failed selection", async ({
    page,
  }) => {
    await page.goto("/claim/results/select/INQ-NOT-IN-RESULTS");
    await page
      .getByRole("table")
      .getByRole("row")
      .nth(1)
      .getByRole("link")
      .click();

    await expect(page).toHaveURL("/claim/type");
  });
});
