import { test, expect } from "#tests/playwright/fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";

test.describe("Apply - journey guard", () => {
  test("redirects to the last completed step when the recipient page is accessed before selecting an address source", async ({
    page,
    withApplyStep,
  }) => {
    await withApplyStep("/apply/client-details/correspondence-address-source");

    await page.goto("/apply/client-details/correspondence-recipient");

    await expect(page).toHaveURL(/\/apply\/client-details\/home-address$/);
    await expect(page.getByTestId("home-address-form")).toBeVisible();
  });

  test("allows returning to the address source and preserves the office address selection", async ({
    page,
    withApplyStep,
  }) => {
    await withApplyStep("/apply/client-details/correspondence-address-source");
    await page.goto("/apply/client-details/correspondence-address-source");

    await page.getByLabel("My office address").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-recipient$/,
    );

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-address-source$/,
    );
    await expect(page.getByLabel("My office address")).toBeChecked();
  });

  test("continues to the recipient page when the client has a home address and selects it for correspondence", async ({
    page,
    withApplyStep,
  }) => {
    await withApplyStep("/apply/client-details/home-address");
    await page.goto("/apply/client-details/home-address");

    await getAndUpdateFormFields(page, {
      "Address line 1": "4 Privet Drive",
      "Town or city": "Little Whinging",
      Postcode: "SW1A 1AA",
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-address-source$/,
    );

    await page.getByLabel("My client's UK home address").check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-recipient$/,
    );
    await expect(
      page.getByTestId("correspondence-recipient-form"),
    ).toBeVisible();
  });

  test("requires a valid correspondence address after changing from office address to another UK address", async ({
    page,
    withApplyStep,
  }) => {
    await withApplyStep("/apply/client-details/correspondence-address-source");
    await page.goto("/apply/client-details/correspondence-address-source");

    await page.getByLabel("My office address").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-recipient$/,
    );

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await page.getByLabel("Another UK address").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-address$/,
    );

    await page.goto("/apply/client-details/correspondence-recipient");
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-address-source$/,
    );
    await expect(page.getByLabel("Another UK address")).toBeChecked();

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-address$/,
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-address$/,
    );

    await getAndUpdateFormFields(page, {
      "Address line 1": "1 Acacia Avenue",
      "Town or city": "London",
      Postcode: "SW1A 1AA",
    });
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(
      /\/apply\/client-details\/correspondence-recipient$/,
    );
    await expect(
      page.getByTestId("correspondence-recipient-form"),
    ).toBeVisible();
  });
});
