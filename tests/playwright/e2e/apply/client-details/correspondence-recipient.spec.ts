import { test, expect } from "../../../fixtures/index.js";
import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";

test.describe("Client details - correspondence recipient", () => {
  test("renders recipient form with expected title, options and hint", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Do you want to add a 'care of' recipient for your client's mail?",
    });

    const form = page.getByTestId("correspondence-recipient-form");
    const personOption = form.getByLabel("Yes, a person");
    const organisationOption = form.getByLabel("Yes, an organisation");
    const noOption = form.getByLabel("No");
    const noHint = form.getByText(
      "Correspondence will be addressed to the client",
    );

    await expect(backButton).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(form).toBeVisible();
    await expect(personOption).toBeVisible();
    await expect(organisationOption).toBeVisible();
    await expect(noOption).toBeVisible();
    await expect(noHint).toBeVisible();
  });

  test("shows validation error when no option is selected", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    const form = page.getByTestId("correspondence-recipient-form");
    await form.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(form.locator("#correspondence-recipient-error")).toBeVisible();
  });

  test("shows validation error when person is selected and name is empty", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    await page.getByLabel("Yes, a person").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    const form = page.getByTestId("correspondence-recipient-form");
    await expect(
      form.locator("#correspondence-recipient-person-name-error"),
    ).toBeVisible();
  });

  test("shows validation error when person name exceeds 100 characters", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    const form = page.getByTestId("correspondence-recipient-form");
    await page.getByLabel("Yes, a person").check();
    await page
      .locator("#correspondence-recipient-person-name")
      .fill("a".repeat(101));
    await form.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessageElement = form.locator(
      "#correspondence-recipient-person-name-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      CLIENT_DETAILS_ERROR.CORRESPONDENCE_RECIPIENT_PERSON_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
    );
    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );
  });

  test("shows validation error when person name contains invalid characters", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    const form = page.getByTestId("correspondence-recipient-form");
    await page.getByLabel("Yes, a person").check();
    await page.locator("#correspondence-recipient-person-name").fill("John@");
    await form.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    const errorMessageElement = form.locator(
      "#correspondence-recipient-person-name-error",
    );
    await expect(errorMessageElement).toBeVisible();
    await expect(errorMessageElement).toContainText(
      CLIENT_DETAILS_ERROR.CORRESPONDENCE_RECIPIENT_PERSON_NAME_INVALID_CHARACTERS,
    );
    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );
  });

  test("continues when person name contains unicode characters", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    await page.getByLabel("Yes, a person").check();
    await page
      .locator("#correspondence-recipient-person-name")
      .fill("Jos\u00E9 \u0141ukasz");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain("/apply/proceedings");
  });

  test("continues to proceedings page when no is selected", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    await page.getByLabel("No").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain("/apply/proceedings");
  });

  test("clears no organisation specified error when switching from organisation to person option", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    const form = page.getByTestId("correspondence-recipient-form");

    await page.getByLabel("Yes, an organisation").check();
    await form.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(
      form.locator("#correspondence-recipient-organisation-name-error"),
    ).toBeVisible();

    await page.getByLabel("Yes, a person").check();

    await expect(
      form.locator("#correspondence-recipient-organisation-name-error"),
    ).not.toBeVisible();

    const personNameInput = page.locator(
      "#correspondence-recipient-person-name",
    );
    await expect(personNameInput).toBeVisible();
    await expect(
      form.locator("#correspondence-recipient-person-name-error"),
    ).not.toBeVisible();
  });
  test("clears no person specified error when switching from person to organisation option", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    const form = page.getByTestId("correspondence-recipient-form");

    await page.getByLabel("Yes, a person").check();
    await form.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(
      form.locator("#correspondence-recipient-person-name-error"),
    ).toBeVisible();

    await page.getByLabel("Yes, an organisation").check();

    await expect(
      form.locator("#correspondence-recipient-person-name-error"),
    ).not.toBeVisible();

    const orgNameInput = page.locator(
      "#correspondence-recipient-organisation-name",
    );
    await expect(orgNameInput).toBeVisible();
    await expect(
      form.locator("#correspondence-recipient-organisation-name-error"),
    ).not.toBeVisible();
  });
});
