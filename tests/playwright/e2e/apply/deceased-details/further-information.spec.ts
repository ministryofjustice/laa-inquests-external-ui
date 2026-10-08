import { test, expect } from "#tests/playwright/fixtures/index.js";
import type { Locator } from "playwright-core";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import {
  continueToNextPage,
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "../../../utils/govuk-validators.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/further-information");
    form = await page.getByTestId("deceased-further-information-form");
  });

  test("view deceased details further information page", async ({
    page,
    checkAccessibility,
  }) => {
    await validateHeader(
      page,
      "Are there any other inquests relating to this incident?",
      1,
    );
    await validateBackButton(page, "/apply/deceased-details/coroner-reference");
    await validateFormAttributes(
      form,
      "/apply/deceased-details/further-information",
    );
    await validateCSRFToken(form);
    await validateContinueButton(form);
    const yesRadio = form.getByRole("radio", { name: "Yes", exact: true });
    const noRadio = form.getByRole("radio", { name: "No", exact: true });
    const dontKnowRadio = form.getByRole("radio", {
      name: "Don't know",
      exact: true,
    });
    const detailsInput = form.getByLabel(
      "Enter details of any linked or bridged inquests you are aware of (optional)",
    );
    await expect(yesRadio).toBeVisible();
    await expect(noRadio).toBeVisible();
    await expect(dontKnowRadio).toBeVisible();
    await expect(detailsInput).toBeHidden();
    await yesRadio.click();
    await expect(detailsInput).toBeVisible();

    await checkAccessibility();
  });

  test("continue to confirmation page", async ({ page }) => {
    const noRadio = form.getByRole("radio", { name: "No", exact: true });
    await noRadio.click();

    await continueToNextPage(form, page);
    await expect(page.url()).toContain("apply/public-authority");
  });

  test("Don't know continues to the public authority page", async ({
    page,
  }) => {
    await form.getByRole("radio", { name: "Don't know", exact: true }).check();

    await continueToNextPage(form, page);
    await expect(page).toHaveURL(/apply\/public-authority/);
  });

  test("continues when Yes is selected without entering details", async ({
    page,
  }) => {
    await form.getByRole("radio", { name: "Yes", exact: true }).check();

    await continueToNextPage(form, page);
    await expect(page).toHaveURL(/apply\/public-authority/);
  });

  test("shows an error when no option is selected", async ({ page }) => {
    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );
    await expect(
      form.getByText(
        DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_SELECTION_REQUIRED,
      ),
    ).toBeVisible();
  });

  test("shows an error when yes is selected and text is less than 2 characters", async ({
    page,
  }) => {
    const yesRadio = form.getByLabel("Yes");
    await yesRadio.click();

    const infoInput = form.getByLabel(
      "Enter details of any linked or bridged inquests you are aware of (optional)",
    );
    await infoInput.fill("a");

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );
    await expect(
      form.getByText(DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX),
    ).toBeVisible();
  });

  test("shows an error when yes is selected and text exceeds 500 characters", async ({
    page,
  }) => {
    const yesRadio = form.getByLabel("Yes");
    await yesRadio.click();

    const infoInput = form.getByLabel(
      "Enter details of any linked or bridged inquests you are aware of (optional)",
    );
    await infoInput.fill("a".repeat(501));

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );
    await expect(
      form.getByText(DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX),
    ).toBeVisible();
  });

  test("fill in details, continue and navigate back with deceased details further information automatically filled in", async ({
    page,
  }) => {
    const yesRadio = form.getByLabel("Yes");
    await yesRadio.click();
    const yesInput = form.getByLabel(
      "Enter details of any linked or bridged inquests you are aware of (optional)",
    );
    await yesInput.fill("Test");

    await continueToNextPage(form, page);
    await page.goto("/apply/deceased-details/further-information");
    await expect(yesRadio).toBeChecked();
    await expect(yesInput).toHaveValue("Test");
  });
});
