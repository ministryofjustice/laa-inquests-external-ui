import { Page, type Locator } from "@playwright/test";
import { test, expect } from "../../../fixtures/index.js";

test.describe("Deceased details - name", () => {
  test("renders basic details header and back link", async ({ page }) => {
    page.goto("/apply/deceased-details/name");
    const deceasedDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "What is the name of the deceased?",
    });
    const backButton = page.getByRole("link", { name: "Back", exact: true });

    await expect(deceasedDetailsHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", "/apply/proceedings");
  });

  test("renders deceased details form", async ({ page }) => {
    page.goto("/apply/deceased-details/name");

    const deceasedDetailsForm = await page.getByTestId("deceased-details-form");
    const firstNameLabel = deceasedDetailsForm.getByLabel("First name");
    const lastNameLabel = deceasedDetailsForm.getByLabel("Last name", {
      exact: true,
    });
    const continueButton = deceasedDetailsForm.getByRole("button");

    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("apply/deceased-details/dod");
  });
});
