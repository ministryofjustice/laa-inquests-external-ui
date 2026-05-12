import { test, expect } from "../../../fixtures/index.js";
import type { Locator } from "playwright-core";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
  validateFormAttributes,
  continueToNextPage,
  validateYesNoRadioWithConditionalInput,
} from "./form-validation-utils.js";

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
      2,
    );
    await validateBackButton(page, "/apply/deceased-details/dob");
    await validateFormAttributes(
      form,
      "/apply/deceased-details/client-relationship",
    );
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const definitionOfFamilyMemberHeader =
      "Definition of a family member according to the bill:";
    await validateFormTextIsVisible(form, definitionOfFamilyMemberHeader);

    const definitionOfFamilyMemberParagraph =
      "A family member is defined as someone who is a  relative (of full or half blood, or by marriage or civil partnership), a cohabitant as defined in Part 4 of the Family Law Act 1996, or where one person has parental responsibility for the other.";
    await validateFormTextIsVisible(form, definitionOfFamilyMemberParagraph);

    await validateYesNoRadioWithConditionalInput(
      form,
      "Please describe the nature of the relationship between your client and the deceased.",
    );
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

  async function validateFormTextIsVisible(form: Locator, text: string) {
    const textElement = form.getByText(text);
    await expect(textElement).toBeVisible();
  }

  async function fillClientRelationshipInput(form: Locator) {
    const yesRadioLabel = form.getByLabel("Yes");
    await yesRadioLabel.click();

    const yesInputLabel = form.getByLabel(
      "Please describe the nature of the relationship between your client and the deceased.",
    );
    await yesInputLabel.fill("Father");
  }
});
