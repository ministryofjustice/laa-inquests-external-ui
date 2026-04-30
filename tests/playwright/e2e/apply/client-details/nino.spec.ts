import { test, expect } from "../../../fixtures/index.js";

test.describe("Client details - NINO page", () => {
  test("renders NINO page header and back link", async ({ page }) => {
    page.goto("/apply/client-details/nino");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const ninoHeading = await page.getByRole("heading", {
      level: 1,
      name: "Does your client have a National Insurance number?",
    });

    const ninoForm = await page.getByTestId("nino-form");
    const yesRadioLabel = ninoForm.getByLabel("Yes");
    const noRadioLabel = ninoForm.getByLabel("No");
    const yesInputLabel = ninoForm.getByLabel(
      "Enter your client's National Insurance number",
    );
    const continueButton = ninoForm.getByRole("button");

    await expect(ninoHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/client-details/name-and-dob",
    );

    await expect(yesRadioLabel).toBeVisible();
    await expect(noRadioLabel).toBeVisible();
    await expect(yesInputLabel).toBeHidden();
    yesRadioLabel.click();
    await expect(yesInputLabel).toBeVisible();

    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");
    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(
      "apply/client-details/has-prev-application",
    );
  });
});
