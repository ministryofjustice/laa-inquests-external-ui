import { test, expect } from "../../../fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";

test.describe("Client details - correspondence address", () => {
  test("renders correspondence address form with expected title and fields", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const heading = page.getByRole("heading", {
      level: 1,
      name: "What is the address you want to send the correspondence to?",
    });

    const form = page.getByTestId("correspondence-address-form");
    const addressLine1 = form.getByLabel("Address line 1");
    const addressLine2 = form.getByLabel("Address line 2 (optional)");
    const townOrCity = form.getByLabel("Town or city");
    const county = form.getByLabel("County (optional)");
    const postcode = form.getByLabel("Postcode");
    const continueButton = form.getByRole("button");

    await expect(backButton).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(form).toBeVisible();
    await expect(addressLine1).toBeVisible();
    await expect(addressLine2).toBeVisible();
    await expect(townOrCity).toBeVisible();
    await expect(county).toBeVisible();
    await expect(postcode).toBeVisible();
    await expect(form.getByLabel("Client has no fixed abode")).toHaveCount(0);
    await expect(continueButton).toHaveText("Continue");
  });

  test("continues to previous applications page with valid correspondence address", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address");

    await getAndUpdateFormFields(page, {
      "Address line 1": "1 Acacia Avenue",
      "Address line 2 (optional)": "Flat 2",
      "Town or city": "London",
      "County (optional)": "Greater London",
      Postcode: "SW1A 1AA",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/has-prev-application",
    );
  });

  test.describe("render validation errors", () => {
    test("if address line 1 is missing", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        "Town or city": "London",
        Postcode: "SW1A 1AA",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      await expect(
        form.locator("#correspondence-address-line-1-error"),
      ).toBeVisible();
    });

    test("if town or city is missing", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        "Address line 1": "1 Acacia Avenue",
        Postcode: "SW1A 1AA",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      await expect(
        form.locator("#correspondence-town-or-city-error"),
      ).toBeVisible();
    });

    test("if postcode is missing", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        "Address line 1": "1 Acacia Avenue",
        "Town or city": "London",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      await expect(
        form.locator("#correspondence-postcode-error"),
      ).toBeVisible();
    });
  });
});
