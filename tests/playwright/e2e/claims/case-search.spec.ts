import { test, expect } from "../../fixtures/index.js";

test.describe("Claim - case search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim");
  });

  test("renders back link to home", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Which case do you want to make a claim for?",
      }),
    ).toBeVisible();
  });

  test("renders case reference input with label", async ({ page }) => {
    const form = page.getByTestId("case-search-form");

    await expect(form).toBeVisible();
    await expect(
      form.getByLabel("Enter the case reference number"),
    ).toBeVisible();
  });

  test("renders continue button to the right of the input", async ({
    page,
  }) => {
    const form = page.getByTestId("case-search-form");
    const continueButton = form.getByRole("button", { name: "Continue" });

    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveAttribute("type", "submit");
  });

  test("shows validation error when submitted with empty case reference", async ({
    page,
  }) => {
    const form = page.getByTestId("case-search-form");

    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Case reference is required")).toBeVisible();
  });

  test("submits form when case reference is provided", async ({ page }) => {
    const form = page.getByTestId("case-search-form");

    await form.getByLabel("Enter the case reference number").fill("ABC-12345");
    await form.getByRole("button", { name: "Continue" }).click();

    await expect(page).not.toHaveURL("/claim");
  });
});
