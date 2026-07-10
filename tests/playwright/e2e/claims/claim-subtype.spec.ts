import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - claim subtype", () => {
  test.beforeEach(async ({ page }) => {
    console.log("Starting claim-subtype test");
    await page.goto("/claim/subtype");
  });

  test("renders back link to claim type", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/claim/type");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "What type of POA are you claiming?",
      }),
    ).toBeVisible();
  });

  test("renders the three claim subtype options", async ({ page }) => {
    const form = page.getByTestId("claim-subtype-form");

    await expect(form).toBeVisible();
    await expect(form.getByLabel("Profit cost")).toBeVisible();
    await expect(form.getByLabel("Expert cost")).toBeVisible();
    await expect(form.getByLabel("Non-expert disbursement")).toBeVisible();
  });

  test("renders continue button", async ({ page }) => {
    const form = page.getByTestId("claim-subtype-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted without a selection", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-subtype-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/subtype");
    await expect(
      page.getByRole("link", {
        name: "Please select a Payment on Account claim type",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Error: Please select a Payment on Account claim type"),
    ).toBeVisible();
  });

  test("redirects to total cost page when an option is selected", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-subtype-form");

    await form.getByLabel("Profit cost").check();
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/claim/total-cost");
  });

  test("keeps the previously selected option marked when returning", async ({
    page,
  }) => {
    const form = page.getByTestId("claim-subtype-form");

    await form.getByLabel("Expert cost").check();
    await form.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/claim/total-cost");

    await page.goto("/claim/subtype");

    await expect(
      page.getByTestId("claim-subtype-form").getByLabel("Expert cost"),
    ).toBeChecked();
  });
});
