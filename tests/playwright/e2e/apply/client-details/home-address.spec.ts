import { test, expect } from "../../../fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";
import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";

const validHomeAddress = {
  "Address line 1": "4 Privet Drive",
  "Address line 2 (optional)": "Little Whinging",
  "Town or city": "Little Whinging",
  "County (optional)": "Surrey",
  Postcode: "SW1A 1AA",
};

const expectedHomeAddressErrors = {
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

    await getAndUpdateFormFields(page, validHomeAddress);

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );
  });

  test("continues when valid minimum length address values are entered", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/home-address");

    await getAndUpdateFormFields(page, {
      "Address line 1": "1A",
      "Town or city": "Ly",
      "County (optional)": "Ayr",
      Postcode: "A1 1A",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );
  });

  test("continues when postcode is entered in lowercase and stores it in uppercase", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/home-address");

    await getAndUpdateFormFields(page, {
      ...validHomeAddress,
      Postcode: "sw1a 1aa",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );

    await page.goto("/apply/client-details/home-address");
    await expect(page.getByLabel("Postcode")).toHaveValue("SW1A 1AA");
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
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_HOME_ADDRESS_LINE_1,
      );
    });

    test("if address line 1 is less than 2 characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 1": "A",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine1MinMax,
      );
    });

    test("if address line 1 exceeds max character length", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 1": "a".repeat(101),
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine1MinMax,
      );
    });

    test("if address line 1 does not contain an alphanumeric character", async ({
      page,
    }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 1": "---",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine1RequiresAlphanumeric,
      );
    });

    test("if address line 1 contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 1": "Flat 1@",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-1-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine1InvalidCharacters,
      );
    });

    test("if address line 2 is less than 2 characters when populated", async ({
      page,
    }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 2 (optional)": "A",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-2-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine2MinMax,
      );
    });

    test("if address line 2 exceeds max character length", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 2 (optional)": "a".repeat(101),
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-2-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine2MinMax,
      );
    });

    test("if address line 2 contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Address line 2 (optional)": "Flat 1@",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-address-line-2-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.addressLine2InvalidCharacters,
      );
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
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_HOME_TOWN_OR_CITY,
      );
    });

    test("if town or city is less than 2 characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Town or city": "A",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.townOrCityMinMax,
      );
    });

    test("if town or city exceeds max character length", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Town or city": "a".repeat(51),
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.townOrCityMinMax,
      );
    });

    test("if town or city contains numbers", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Town or city": "London2",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.townOrCityInvalidCharacters,
      );
    });

    test("if town or city contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "Town or city": "St. Albans",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator(
        "#home-town-or-city-error",
      );
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.townOrCityInvalidCharacters,
      );
    });

    test("if county is less than 3 characters when populated", async ({
      page,
    }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "County (optional)": "AB",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-county-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.countyMinMax,
      );
    });

    test("if county exceeds max character length", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "County (optional)": "a".repeat(51),
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-county-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.countyMinMax,
      );
    });

    test("if county contains numbers", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "County (optional)": "Surrey2",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-county-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.countyInvalidCharacters,
      );
    });

    test("if county contains invalid characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        "County (optional)": "St. Mary",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-county-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.countyInvalidCharacters,
      );
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
      await expect(errorMessageElement).toContainText(
        CLIENT_DETAILS_ERROR.MISSING_HOME_POSTCODE,
      );
    });

    test("if postcode is less than 5 characters", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        Postcode: "A1 1",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-postcode-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.postcodeMinMax,
      );
    });

    test("if postcode exceeds max character length", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        Postcode: "AA11 1AAA",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-postcode-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.postcodeMinMax,
      );
    });

    test("if postcode contains punctuation", async ({ page }) => {
      await page.goto("/apply/client-details/home-address");
      const addressForm = await page.getByTestId("home-address-form");

      await getAndUpdateFormFields(page, {
        ...validHomeAddress,
        Postcode: "SW1A-1AA",
      });

      await addressForm.getByRole("button", { name: "Continue" }).click();
      await page.waitForLoadState("domcontentloaded");

      const errorMessageElement = addressForm.locator("#home-postcode-error");
      await expect(errorMessageElement).toBeVisible();
      await expect(errorMessageElement).toContainText(
        expectedHomeAddressErrors.postcodeInvalidCharacters,
      );
    });
  });
});
