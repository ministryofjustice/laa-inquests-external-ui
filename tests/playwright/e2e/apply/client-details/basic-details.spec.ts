import { test, expect } from "../../../fixtures/index.js";
import describe from "@playwright/test"

  test("renders basic details header and back link", async ({ page }) => {
    page.goto("/apply/basic-client-details")
    const clientDetailsHeading = await page.getByRole("heading", { level: 2, name: "Enter your client's details"})
    const backButton = page.getByRole("link", { name: "Back", exact: true});

    await expect(clientDetailsHeading).toBeVisible();
    
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", "/apply");

  })

  test("renders basic client details form", async ({ page }) => {
    page.goto("/apply/basic-client-details")

    const basicDetailsForm = await page.getByTestId("client-details-form")
    const firstNameLabel = basicDetailsForm.getByLabel("First name")
    const lastNameLabel = basicDetailsForm.getByLabel("Last name", {exact : true})
    const nameChangedLabel = basicDetailsForm.getByText("Has your client ever changed their last name?")
    const yesNameChangedLabel = basicDetailsForm.getByLabel("Yes")
    const yesNameChangedInputLabel = basicDetailsForm.getByLabel("What was your client's last name at birth?")
    const noNameChangedLabel = basicDetailsForm.getByLabel("No")

    const dobLabel = basicDetailsForm.getByText("Date of birth")
    const continueButton = basicDetailsForm.getByRole("button")

    await expect(basicDetailsForm).toBeVisible();
    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();
    await expect(nameChangedLabel).toBeVisible();
    await expect(yesNameChangedLabel).toBeVisible();
    await expect(noNameChangedLabel).toBeVisible();
    await expect(yesNameChangedInputLabel).toBeHidden();
    yesNameChangedLabel.click();
    await expect(yesNameChangedInputLabel).toBeVisible();

    await expect(dobLabel).toBeVisible();
    await expect(continueButton).toHaveText("Continue")
    await expect(continueButton).toHaveAttribute("type","submit")
    await continueButton.click()
    await page.waitForLoadState("domcontentloaded")
    await expect(page.url()).toContain("apply/client-details/nino")
    
  })