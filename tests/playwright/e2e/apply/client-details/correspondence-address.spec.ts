import { test, expect } from "../../../fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";
import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";

const validCorrespondenceAddress = {
  "Address line 1": "4 Privet Drive",
  "Address line 2 (optional)": "Little Whinging",
  "Town or city": "Little Whinging",
  "County (optional)": "Surrey",
  Postcode: "SW1A 1AA",
};

const expectedCorrespondenceAddressErrors = {
  addressLine1MinMax: "Address line 1 must be between 2 and 100 characters",
  addressLine1RequiresAlphanumeric:
    "Address line 1 must include at least 1 letter or number",
  addressLine1InvalidCharacters:
    "Address line 1 must only include letters, numbers, spaces, hyphens, apostrophes, commas, full stops, forward slashes and ampersands",
  addressLine2MinMax: "Address line 2 must be between 2 and 100 characters",
  addressLine2InvalidCharacters:
    "Address line 2 must only include letters, numbers, spaces, hyphens, apostrophes, commas, full stops, forward slashes and ampersands",
  townOrCityMinMax: "Town or city must be between 2 and 50 characters",
  townOrCityInvalidCharacters:
    "Town or city must only include letters, spaces, hyphens and apostrophes",
  countyMinMax: "County must be between 3 and 50 characters",
  countyInvalidCharacters:
    "County must only include letters, spaces, hyphens and apostrophes",
  postcodeMinMax: "Postcode must be between 5 and 8 characters",
  postcodeInvalidCharacters:
    "Postcode must only include letters, numbers and spaces",
};

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

  test("continues to correspondence recipient page with valid correspondence address", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address");

    await getAndUpdateFormFields(page, validCorrespondenceAddress);

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );
  });

  test("continues when valid minimum length correspondence values are entered", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address");

    await getAndUpdateFormFields(page, {
      "Address line 1": "1A",
      "Town or city": "Ly",
      "County (optional)": "Ayr",
      Postcode: "A1 1A",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );
  });

  test("continues when postcode is entered in lowercase and stores it in uppercase", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address");

    await getAndUpdateFormFields(page, {
      ...validCorrespondenceAddress,
      Postcode: "sw1a 1aa",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );

    await page.goto("/apply/client-details/correspondence-address");
    await expect(page.getByLabel("Postcode")).toHaveValue("SW1A 1AA");
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

      const errorMessageElement = form.locator(
        "#correspondence-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_ADDRESS_LINE_1,
      );
    });

    test("if address line 1 is less than 2 characters", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "Address line 1": "A",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.addressLine1MinMax,
      );
    });

    test("if address line 1 does not contain an alphanumeric character", async ({
      page,
    }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "Address line 1": "---",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.addressLine1RequiresAlphanumeric,
      );
    });

    test("if address line 1 contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "Address line 1": "Flat 1@",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.addressLine1InvalidCharacters,
      );
    });

    test("if address line 2 is less than 2 characters when populated", async ({
      page,
    }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "Address line 2 (optional)": "A",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-address-line-2-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.addressLine2MinMax,
      );
    });

    test("if address line 2 contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "Address line 2 (optional)": "Flat 1@",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-address-line-2-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.addressLine2InvalidCharacters,
      );
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

      const errorMessageElement = form.locator(
        "#correspondence-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_TOWN_OR_CITY,
      );
    });

    test("if town or city contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "Town or city": "London2",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.townOrCityInvalidCharacters,
      );
    });

    test("if county is less than 3 characters when populated", async ({
      page,
    }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "County (optional)": "AB",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator("#correspondence-county-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.countyMinMax,
      );
    });

    test("if county contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        "County (optional)": "Surrey2",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator("#correspondence-county-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.countyInvalidCharacters,
      );
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

      const errorMessageElement = form.locator(
        "#correspondence-postcode-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_POSTCODE,
      );
    });

    test("if postcode contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/correspondence-address");
      const form = page.getByTestId("correspondence-address-form");

      await getAndUpdateFormFields(page, {
        ...validCorrespondenceAddress,
        Postcode: "SW1A-1AA",
      });

      await form.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = form.locator(
        "#correspondence-postcode-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedCorrespondenceAddressErrors.postcodeInvalidCharacters,
      );
    });
  });
});
