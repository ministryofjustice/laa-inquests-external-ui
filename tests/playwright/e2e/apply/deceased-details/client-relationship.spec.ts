import { test, expect } from "../../../fixtures/index.js";
import type { Page, Locator } from "playwright-core";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/client-relationship");
    form = await page.getByTestId("deceased-client-relationship-form");
  });

  test("view deceased client relationship page", async ({ page }) => {
    await validateHeader(
      page,
      "Does your client meet the definition of a family member?",
    );
    await validateBackButton(page, "/apply/deceased-details/dob");
    await validateFormAttributes(form);
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const definitionOfFamilyMemberHeader =
      "Definition of a family member according to the bill:";
    await validateFormTextIsVisible(form, definitionOfFamilyMemberHeader);

    const definitionOfFamilyMemberParagraph =
      "A family member is defined as someone who is a  relative (of full or half blood, or by marriage or civil partnership), a cohabitant as defined in Part 4 of the Family Law Act 1996, or where one person has parental responsibility for the other.";
    await validateFormTextIsVisible(form, definitionOfFamilyMemberParagraph);

    await validateClientRelationshipRadio(form);
  });

  test("continue to coroners reference when they've filled in client relationship", async ({
    page,
  }) => {
    await fillClientRelationshipInput(form);
    await continueToNextPage(form, page);
    await expect(page.url()).toContain(
      "apply/deceased-details/coroner-reference",
    );
  });

  async function validateHeader(page: Page, headerText: string) {
    const heading = await page.getByRole("heading", {
      level: 2,
      name: headerText,
    });
    await expect(heading).toBeVisible();
  }

  async function validateBackButton(page: Page, previousUrl: string) {
    const backButton = page.getByRole("link", { name: "Back", exact: true });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", previousUrl);
  }

  async function validateCSRFToken(form: Locator) {
    const csrfToken = await form.locator("input[name='_csrf']");
    await expect(csrfToken).toBeHidden();
    await expect(csrfToken).not.toBeEmpty();
  }

  async function validateContinueButton(form: Locator) {
    const continueButton = form.getByRole("button");

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");
  }

  async function validateFormAttributes(form: Locator) {
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute(
      "action",
      "/apply/deceased-details/client-relationship",
    );
  }

  async function validateFormTextIsVisible(form: Locator, text: string) {
    const textElement = form.getByText(text);
    await expect(textElement).toBeVisible();
  }

  async function validateClientRelationshipRadio(form: Locator) {
    const yesRadioLabel = form.getByLabel("Yes");
    const noRadioLabel = form.getByLabel("No");
    const yesInputLabel = form.getByLabel(
      "Please describe the nature of the relationship between your client and the deceased.",
    );
    await expect(yesRadioLabel).toBeVisible();
    await expect(noRadioLabel).toBeVisible();
    await expect(yesInputLabel).toBeHidden();

    yesRadioLabel.click();
    await expect(yesInputLabel).toBeVisible();
  }

  async function fillClientRelationshipInput(form: Locator) {
    const yesRadioLabel = form.getByLabel("Yes");
    await yesRadioLabel.click();

    const yesInputLabel = form.getByLabel(
      "Please describe the nature of the relationship between your client and the deceased.",
    );
    await yesInputLabel.fill("Father");
  }

  async function continueToNextPage(form: Locator, page: Page) {
    const continueButton = form.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
  }
});
