import { test, expect } from "../../../fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";

test.describe("Client details - correspondence address source", () => {
  test("renders source page with title, guidance, options and hint", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address-source");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Where should we send your client's correspondence?",
    });
    const guidance = page.getByText(
      "We can not send correspondence to non-UK addresses.",
    );

    const form = page.getByTestId("correspondence-address-source-form");
    const homeAddress = form.getByLabel("My client's UK home address");
    const anotherAddress = form.getByLabel("Another UK address");
    const officeAddress = form.getByLabel("My office address");
    const officeHint = form.getByText(
      "Use this option if your client has no fixed address",
    );
    const continueButton = form.getByRole("button");

    await expect(backButton).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(guidance).toBeVisible();
    await expect(form).toBeVisible();
    await expect(homeAddress).toBeVisible();
    await expect(anotherAddress).toBeVisible();
    await expect(officeAddress).toBeVisible();
    await expect(officeHint).toBeVisible();
    await expect(continueButton).toHaveText("Continue");
  });

  test("shows validation error when no option is selected", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address-source");

    const form = page.getByTestId("correspondence-address-source-form");
    await form.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(
      form.locator("#correspondence-address-source-error"),
    ).toBeVisible();
  });

  test("continues to correspondence address form when another UK address is selected", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address-source");

    await page.getByLabel("Another UK address").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address",
    );
  });

  test("continues to previous applications page when office address is selected", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/correspondence-address-source");

    await page.getByLabel("My office address").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/has-prev-application",
    );
  });

  test("shows an error when home address is selected after no fixed abode was chosen", async ({
    page,
  }) => {
    await page.goto("/apply/client-details/home-address");

    await page.getByLabel("Client has no fixed abode").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );

    await getAndUpdateFormFields(page, {
      "My client's UK home address": "",
    });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");

    const form = page.getByTestId("correspondence-address-source-form");
    await expect(
      form.locator("#correspondence-address-source-error"),
    ).toBeVisible();
    await expect(form).toContainText(
      "You cannot select your client's UK home address when they have no fixed abode",
    );
  });
});
