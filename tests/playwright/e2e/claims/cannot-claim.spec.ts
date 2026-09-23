import { test, expect } from "../../fixtures/index.js";
import type { Page } from "@playwright/test";

async function searchAndSelect(page: Page, caseReference: string) {
  await page.goto("/claim");
  await page
    .getByTestId("case-search-form")
    .getByLabel("Enter the case reference number")
    .fill(caseReference);
  await page
    .getByTestId("case-search-form")
    .getByRole("button", { name: "Continue" })
    .click();
  await page.waitForURL("**/claim/results");
  await page
    .getByRole("table")
    .getByRole("row")
    .nth(1)
    .getByRole("link")
    .click();
}

test.describe("Claim - cannot make a claim (entry block)", () => {
  test("takes a blocked provider to the cannot-claim page", async ({
    page,
  }) => {
    await searchAndSelect(page, "force-blocked");

    await expect(page).toHaveURL("/claim/cannot-claim");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "You cannot make a claim against this certificate",
      }),
    ).toBeVisible();
  });

  test("shows the application reference and pending review message", async ({
    page,
  }) => {
    await searchAndSelect(page, "force-blocked");

    await expect(page.getByText("INQ-YYY-BLOCKED")).toBeVisible();
    await expect(
      page.getByText(
        "A final bill claim has already been submitted and is pending review.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "You cannot submit another claim until the current claim has been assessed.",
      ),
    ).toBeVisible();
  });

  test("provides a Back to search link to /claim", async ({ page }) => {
    await searchAndSelect(page, "force-blocked");

    const backToSearch = page.getByRole("button", { name: "Back to search" });
    await expect(backToSearch).toBeVisible();
    await expect(backToSearch).toHaveAttribute("href", "/claim");

    await backToSearch.click();
    await expect(page).toHaveURL("/claim");
  });

  test("has no accessibility violations", async ({
    page,
    checkAccessibility,
  }) => {
    await searchAndSelect(page, "force-blocked");

    await checkAccessibility();
  });

  test("allows a non-blocked case to enter the claim flow", async ({
    page,
  }) => {
    await searchAndSelect(page, "INQ-YYY-001");

    await expect(page).toHaveURL("/claim/type");
  });
});
