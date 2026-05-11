import { test, expect } from "../../../fixtures/index.js";

test.describe.only("Deceased details - date of birth", () => {
  test.describe("renders", () => {
    test("header", async ({ page }) => {
      page.goto("/apply/deceased-details/dob");
      const deceasedDateOfBirthHeading = await page.getByRole("heading", {
        level: 2,
        name: "What was their date of birth?",
      });
      await expect(deceasedDateOfBirthHeading).toBeVisible();
    });
    test("back button", async ({ page }) => {
      page.goto("/apply/deceased-details/dob");
      const backButton = page.getByRole("link", { name: "Back", exact: true });
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute(
        "href",
        "/apply/deceased-details/dod",
      );
    });
    test("form fields which post to the date of birth route", async ({
      page,
    }) => {
      page.goto("/apply/deceased-details/dob");

      const deceasedForm = await page.getByTestId(
        "deceased-date-of-birth-form",
      );

      const csrfToken = await deceasedForm.locator("input[name='_csrf']");
      await expect(csrfToken).toBeHidden();
      await expect(csrfToken).not.toBeEmpty();

      const dateOfBirthInput = await deceasedForm.getByText("Date of birth");
      const continueButton = deceasedForm.getByRole("button");

      await expect(dateOfBirthInput).toBeVisible();
      await expect(continueButton).toBeVisible();
      await expect(continueButton).toHaveText("Continue");
      await expect(continueButton).toHaveAttribute("type", "submit");

      await expect(deceasedForm).toHaveAttribute("method", "post");
      await expect(deceasedForm).toHaveAttribute(
        "action",
        "/apply/deceased-details/dob",
      );
    });
  });
  test("redirects to client relationship on valid input", async ({ page }) => {
    page.goto("/apply/deceased-details/dob");
    const deceasedForm = await page.getByTestId("deceased-date-of-birth-form");

    const dayInput = deceasedForm.getByLabel("Day");
    const monthInput = deceasedForm.getByLabel("Month");
    const yearInput = deceasedForm.getByLabel("Year");

    await dayInput.fill("1");
    await monthInput.fill("1");
    await yearInput.fill("1990");

    const continueButton = deceasedForm.getByRole("button");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(
      "apply/deceased-details/client-relationship",
    );
  });
});
