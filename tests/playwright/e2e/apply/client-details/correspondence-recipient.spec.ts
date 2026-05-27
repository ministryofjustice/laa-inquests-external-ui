import { test, expect } from "../../../fixtures/index.js";

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

  test("continues to previous applications page when no recipient is selected", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-recipient");

    await page.getByLabel("No").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/has-prev-application",
    );
  });
});
