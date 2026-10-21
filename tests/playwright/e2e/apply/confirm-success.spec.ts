import { test, expect } from "../../fixtures/index.js";

test.describe("Apply - confirm success", () => {
  test("renders confirm success page header", async ({
    page,
    checkAccessibility,
  }) => {
    page.goto("/apply/confirmation/success");

    const confirmSuccessHeading = await page.getByRole("heading", {
      level: 1,
      name: "Your application has been submitted",
    });
    const caseRefHeading = page.getByText("Application reference number");

    await expect(confirmSuccessHeading).toBeVisible();
    await expect(caseRefHeading).toBeVisible();

    await checkAccessibility();
  });

  test("sets the browser tab title from the page heading", async ({ page }) => {
    page.goto("/apply/confirmation/success");

    await expect(page).toHaveTitle(
      /Your application has been submitted – Inquests – GOV\.UK/,
    );
  });

  test("renders confirm success page content", async ({ page }) => {
    page.goto("/apply/confirmation/success");

    const whatHappensNext = await page.getByRole("heading", {
      level: 2,
      name: "What happens next",
    });

    await expect(whatHappensNext).toBeVisible();

    const emailConfirmMessage = page.getByText(
      "We have sent you an email that contains details of the information you have entered.",
    );
    await expect(emailConfirmMessage).toBeVisible();

    const printMessage = page.getByText(
      "You should print a copy of your application and ask your client to sign the declaration. Keep this on file in case it is requested by the Legal Aid Agency for audit purposes.",
    );
    const whatHappensNextMessage = page.getByText(
      "Your application will be reviewed by the Legal Aid Agency, and we will update you with our decision by email.",
    );

    await expect(printMessage).toBeVisible();
    await expect(whatHappensNextMessage).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Make a new application" }),
    ).toHaveAttribute("href", "/apply");
  });
});
