import { test, expect } from "../../../fixtures/index.js";

test.describe.only("Deceased details - date of death", () => {
  test("renders basic details header and back link", async ({ page }) => {
    page.goto("/apply/deceased-details/dod");
    const deceasedDateOfDeathHeading = await page.getByRole("heading", {
      level: 2,
      name: "What was their date of death?",
    });
    await expect(deceasedDateOfDeathHeading).toBeVisible();
  });

  test("renders back label with href pointing to deceased name", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/dod");
    const backButton = page.getByRole("link", { name: "Back", exact: true });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/deceased-details/name",
    );
  });

  test("renders form fields and posts to date of death route", async ({
    page,
  }) => {
    page.goto("/apply/deceased-details/dod");

    const deceasedForm = await page.getByTestId("deceased-date-of-death-form");
    const dateOfDeathInput = await deceasedForm.getByText("Date of death");
    const continueButton = deceasedForm.getByRole("button");

    await expect(dateOfDeathInput).toBeVisible();
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");

    await expect(deceasedForm).toHaveAttribute("method", "post");
    await expect(deceasedForm).toHaveAttribute(
      "action",
      "/apply/deceased-details/dod",
    );
  });
});
