import type { Page } from "@playwright/test";

export async function selectProceeding(page: Page, proceeding: string) {
  await page.goto("/apply/proceeding");
  const selectProceedingForm = await page.getByTestId("add-proceeding-form");

  const proceedingRadio = await selectProceedingForm.getByLabel(proceeding, {
    exact: true,
  });
  await proceedingRadio.click();

  const continueButton = selectProceedingForm.getByRole("button");
  await continueButton.click();
  await page.waitForLoadState("domcontentloaded");
}
