import type { Page, Locator } from "playwright-core";
import { expect } from "../../../fixtures/index.js";

export async function validateHeader(
  page: Page,
  headerText: string,
  headingLevel: number,
): Promise<void> {
  const heading = page.getByRole("heading", {
    level: headingLevel,
    name: headerText,
  });
  await expect(heading).toBeVisible();
}

export async function validateBackButton(
  page: Page,
  previousUrl: string,
): Promise<void> {
  const backButton = page.getByRole("link", { name: "Back", exact: true });
  await expect(backButton).toBeVisible();
  await expect(backButton).toHaveAttribute("href", previousUrl);
}

export async function validateCSRFToken(form: Locator): Promise<void> {
  const csrfToken = form.locator("input[name='_csrf']");
  await expect(csrfToken).toBeHidden();
  await expect(csrfToken).not.toBeEmpty();
}

export async function validateContinueButton(form: Locator): Promise<void> {
  const continueButton = form.getByRole("button");

  await expect(continueButton).toBeVisible();
  await expect(continueButton).toHaveText("Continue");
  await expect(continueButton).toHaveAttribute("type", "submit");
}

export async function validateFormAttributes(
  form: Locator,
  action: string,
): Promise<void> {
  await expect(form).toHaveAttribute("method", "post");
  await expect(form).toHaveAttribute("action", action);
}

export async function continueToNextPage(
  form: Locator,
  page: Page,
): Promise<void> {
  const continueButton = form.getByRole("button");
  await continueButton.click();
  await page.waitForLoadState("domcontentloaded");
}

export async function validateYesNoRadioWithConditionalInput(
  form: Locator,
  inputLabelText: string,
): Promise<void> {
  const yesRadioLabel = form.getByLabel("Yes");
  const noRadioLabel = form.getByLabel("No");
  const yesInputLabel = form.getByLabel(inputLabelText);
  await expect(yesRadioLabel).toBeVisible();
  await expect(noRadioLabel).toBeVisible();
  await expect(yesInputLabel).toBeHidden();

  await yesRadioLabel.click();
  await expect(yesInputLabel).toBeVisible();
}
