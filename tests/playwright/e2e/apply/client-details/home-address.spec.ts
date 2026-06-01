import { test, expect } from "../../../fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";

test.describe("Client details - home address", () => {
  test("renders home address page header and back link", async ({ page }) => {
    await page.goto("/apply/client-details/home-address");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const heading = await page.getByRole("heading", {
      level: 1,
      name: "What is your client's home address?",
    });

    const addressForm = await page.getByTestId("home-address-form");
    const addressLine1 = addressForm.getByLabel("Address line 1");
    const addressLine2 = addressForm.getByLabel("Address line 2 (optional)");
    const townOrCity = addressForm.getByLabel("Town or city");
    const county = addressForm.getByLabel("County (optional)");
    const postcode = addressForm.getByLabel("Postcode");
    const hasNoFixedAbode = addressForm.getByLabel("Client has no fixed abode");
    const continueButton = addressForm.getByRole("button");

    await expect(heading).toBeVisible();
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/client-details/has-prev-application",
    );
    await expect(addressLine1).toBeVisible();
    await expect(addressLine2).toBeVisible();
    await expect(townOrCity).toBeVisible();
    await expect(county).toBeVisible();
    await expect(postcode).toBeVisible();
    await expect(hasNoFixedAbode).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("continues when no fixed abode is selected", async ({ page }) => {
    await page.goto("/apply/client-details/home-address");

    await page.getByLabel("Client has no fixed abode").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );
  });

  test("continues to previous applications page when valid details are entered", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/home-address");

    await getAndUpdateFormFields(page, {
      "Address line 1": "4 Privet Drive",
      "Address line 2 (optional)": "Little Whinging",
      "Town or city": "Little Whinging",
      "County (optional)": "Surrey",
      Postcode: "SW1A 1AA",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );
  });

  test.describe("render validation errors", () => {
    test("if address line 1 is missing", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        "Town or city": "London",
        Postcode: "SW1A 1AA",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
    });

    test("if town or city is missing", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        "Address line 1": "4 Privet Drive",
        Postcode: "SW1A 1AA",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
    });

    test("if postcode is missing", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        "Address line 1": "4 Privet Drive",
        "Town or city": "London",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-postcode-error");
      await expect(errorMessageElement).toBeVisible();
    });

    test("if postcode is invalid", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        "Address line 1": "4 Privet Drive",
        "Town or city": "London",
        Postcode: "invalid-postcode",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-postcode-error");
      await expect(errorMessageElement).toBeVisible();
    });
  });
});
