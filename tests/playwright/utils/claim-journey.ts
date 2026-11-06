import { expect, type Page, type Response } from "@playwright/test";
import { CLAIM_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";
import { CHECK_YOUR_ANSWERS_ORIGIN } from "#src/infrastructure/locales/constants.js";
import { CLAIM_PATHS } from "#src/infrastructure/express/routes/paths.js";

export async function setClaimStepForUrl(
  page: Page,
  pageUrl: string,
): Promise<void> {
  const stepIndex = CLAIM_JOURNEY_SEQUENCE.indexOf(pageUrl);
  expect(
    stepIndex,
    `Unknown claim journey step: ${pageUrl}`,
  ).toBeGreaterThanOrEqual(0);
  const response = await page.request.get(
    `/auth/test-login?claimStep=${stepIndex - 1}`,
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(302);
}

export async function gotoClaimStep(
  page: Page,
  pageUrl: string,
): Promise<Response | null> {
  const { pathname, searchParams } = new URL(pageUrl, "http://localhost");
  if (pathname !== "/claim" && pathname !== "/claim/cannot-claim") {
    const canonicalUrl =
      pathname === "/claim/confirmation/reject"
        ? "/claim/confirmation/success"
        : pathname;
    const stepUrl = CLAIM_JOURNEY_SEQUENCE.find(
      (step) =>
        step === canonicalUrl ||
        (step !== "/claim" && canonicalUrl.startsWith(`${step}/`)),
    );
    expect(stepUrl, `Unknown claim journey step: ${pageUrl}`).toBeDefined();
    if (stepUrl === undefined) {
      throw new Error(`Unknown claim journey step: ${pageUrl}`);
    }
    const entryStepUrl =
      searchParams.get("from") === CHECK_YOUR_ANSWERS_ORIGIN
        ? CLAIM_PATHS.CHECK_YOUR_ANSWERS
        : stepUrl;
    await setClaimStepForUrl(page, entryStepUrl);
  }
  return page.goto(pageUrl);
}

export async function searchAndSelectCase(
  page: Page,
  caseReference: string,
): Promise<void> {
  await gotoClaimStep(page, "/claim/search");
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
