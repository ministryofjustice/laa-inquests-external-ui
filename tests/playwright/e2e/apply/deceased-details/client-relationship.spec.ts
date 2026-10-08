import { test, expect } from "../../../fixtures/index.js";
import type { Locator } from "playwright-core";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import {
  validateHeader,
  validateBackButton,
  validateCSRFToken,
  validateContinueButton,
  validateFormAttributes,
  continueToNextPage,
} from "../../../utils/govuk-validators.js";

test.describe("Provider can", () => {
  let form: Locator;
  test.beforeEach(async ({ page }) => {
    await page.goto("/apply/deceased-details/client-relationship");
    form = await page.getByTestId("deceased-client-relationship-form");
  });

  test("view deceased client relationship page", async ({
    page,
    checkAccessibility,
  }) => {
    await validateHeader(
      page,
      "Is your client a family member of the deceased?",
      1,
    );
    await validateBackButton(page, "/apply/deceased-details/dob");
    await validateFormAttributes(
      form,
      "/apply/deceased-details/client-relationship",
    );
    await validateCSRFToken(form);
    await validateContinueButton(form);

    await expect(
      page.getByText(
        "To qualify for legal aid, your client must be a family member of the deceased.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("A family member is defined as:"),
    ).toBeVisible();
    await expect(
      page.getByText(
        "a relative by either full or half blood, marriage, or civil partnership",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("someone with parental responsibility"),
    ).toBeVisible();
    await expect(
      page.getByText("a cohabitant as defined in the Family Law Act 1996"),
    ).toBeVisible();

    const yesRadioLabel = form.getByLabel("Yes, my client is a family member");
    const noRadioLabel = form.getByLabel(
      "No, my client has a different relationship",
    );
    const relationshipInput = form.getByLabel("My client is the deceased's:");
    await expect(yesRadioLabel).toBeVisible();
    await expect(noRadioLabel).toBeVisible();
    await expect(relationshipInput).toBeHidden();
    await yesRadioLabel.click();
    await expect(relationshipInput).toBeVisible();
    await expect(form.getByText("For example: mother, brother")).toBeVisible();

    await checkAccessibility();
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

  test("shows an error when no radio option is selected", async ({ page }) => {
    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/client-relationship",
    );
    await expect(
      form.getByText(DECEASED_DETAILS_ERROR.RELATIONSHIP_SELECTION_REQUIRED),
    ).toBeVisible();
  });

  test("redirects to the ineligible page when no is selected", async ({
    page,
    checkAccessibility,
  }) => {
    const noRadioLabel = form.getByLabel(
      "No, my client has a different relationship",
    );
    await noRadioLabel.click();

    await continueToNextPage(form, page);

    await expect(page).toHaveURL("/apply/deceased-details/not-eligible");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Your client does not qualify for inquest legal aid",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "To qualify for legal aid, your client must be a family member of the deceased.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("A family member is defined as:"),
    ).toBeVisible();
    await expect(page.locator(".govuk-list--bullet li")).toHaveText([
      "a relative by either full or half blood, marriage, or civil partnership",
      "someone with parental responsibility",
      "a cohabitant as defined in the Family Law Act 1996",
    ]);
    await expect(
      page.getByRole("button", { name: "Make a new application" }),
    ).toHaveAttribute("href", "/apply");

    await checkAccessibility();
  });

  test("shows an error when yes is selected but relationship is empty", async ({
    page,
  }) => {
    const yesRadioLabel = form.getByLabel("Yes, my client is a family member");
    await yesRadioLabel.click();

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/client-relationship",
    );
    await expect(
      form.getByText(DECEASED_DETAILS_ERROR.RELATIONSHIP_REQUIRED_MIN_MAX),
    ).toBeVisible();
  });

  test("shows an error when relationship exceeds 70 characters", async ({
    page,
  }) => {
    const yesRadioLabel = form.getByLabel("Yes");
    await yesRadioLabel.click();

    const relationshipInput = form.getByLabel("My client is the deceased's:");
    await relationshipInput.fill("a".repeat(71));

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(
      "/apply/deceased-details/client-relationship",
    );
    await expect(
      form.getByText(
        DECEASED_DETAILS_ERROR.RELATIONSHIP_EXCEEDS_MAX_CHARACTER_LENGTH,
      ),
    ).toBeVisible();
  });

  test("fill in details, continue and navigate back with deceased details client relationship automatically filled in", async ({
    page,
  }) => {
    await fillClientRelationshipInput(form);
    await continueToNextPage(form, page);
    await page.goto("/apply/deceased-details/client-relationship");
    const yesRadioLabel = form.getByLabel("Yes, my client is a family member");
    await expect(yesRadioLabel).toBeChecked();
    const yesInputLabel = form.getByLabel("My client is the deceased's:");
    await expect(yesInputLabel).toHaveValue("Father");
  });

  async function fillClientRelationshipInput(form: Locator) {
    const yesRadioLabel = form.getByLabel("Yes, my client is a family member");
    await yesRadioLabel.click();

    const yesInputLabel = form.getByLabel("My client is the deceased's:");
    await yesInputLabel.fill("Father");
  }
});
