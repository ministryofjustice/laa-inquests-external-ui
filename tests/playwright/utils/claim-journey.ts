import type { Page } from "@playwright/test";

export async function searchAndSelectCase(
  page: Page,
  caseReference: string,
): Promise<void> {
  await page.goto("/claim/search");
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
  await page.waitForURL("**/claim/type");
}
