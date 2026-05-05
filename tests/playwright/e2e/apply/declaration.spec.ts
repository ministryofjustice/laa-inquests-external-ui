import { test, expect } from "../../fixtures/index.js";
import describe from "@playwright/test";

test("renders declaration subheader, copy text and back button", async ({
  page,
}) => {
  page.goto("/apply");
  const declarationHeading = await page.getByRole("heading", {
    level: 2,
    name: "Declaration",
  });

  const declarationCopy = page.getByText("By continuing, you agree that:");
  const representationDeclaration = await page
    .getByRole("list")
    .getByText("Your client has instructed you to represent them");
  const clientDeclaration = await page
    .getByRole("list")
    .getByText(
      "You'll go through all parts of the application with your client",
    );
  const correctDeclaration = await page
    .getByRole("list")
    .getByText("You'll provide complete and correct information");

  const backButton = page.getByRole("link", { name: "Back", exact: true });

  await expect(declarationHeading).toBeVisible();
  await expect(declarationCopy).toBeVisible();
  await expect(representationDeclaration).toBeVisible();
  await expect(clientDeclaration).toBeVisible();
  await expect(correctDeclaration).toBeVisible();

  await expect(backButton).toBeVisible();
  await expect(backButton).toHaveAttribute("href", "/");
});

test("renders button to start application journey ", async ({ page }) => {
  page.goto("/apply");
  const startButton = page.getByRole("button", { name: "Agree and continue" });
  await expect(startButton).toBeVisible();
  await expect(startButton).toHaveAttribute(
    "href",
    "/apply/client-details/name-and-dob",
  );
  await startButton.click();
});
