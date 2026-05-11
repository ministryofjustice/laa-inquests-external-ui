import { test, expect } from "../../fixtures/index.js";

test.describe("Apply - check your answers", () => {
  test("renders check your answers page header and back link", async ({ page }) => {
    page.goto("/apply/check-your-answers");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const checkYourAnswersHeading = await page.getByRole("heading", {
      level: 1,
      name: "Check your answers",
    });

    await expect(checkYourAnswersHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/fee-earner",
    );

    const caseDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "Case details",
    });

    await expect(caseDetailsHeading).toBeVisible();

    const pageInsetText = page.getByText("You cannot change the answers on this page once you  continue");
    await expect(pageInsetText).toBeVisible();
  });

  test("renders client details summary list", async ({ page }) => {

    page.goto("/apply/check-your-answers");

    const clientDetailsSummaryList = page.getByTestId("client-details-summary-list");
    await expect(clientDetailsSummaryList).toBeVisible();

    const clientDetailsTableHeading = await clientDetailsSummaryList.getByRole("heading", {
      level: 2,
      name: "Client details",
    });
    await expect(clientDetailsTableHeading).toBeVisible();

    const clientDetailsChangeLink = clientDetailsSummaryList.getByRole("link");
    await expect(clientDetailsChangeLink).toBeVisible();

    await expect(clientDetailsChangeLink).toHaveAttribute(
      "href",
      "/apply/client-details/name-and-dob",
    );

    const firstNameRowTitle = clientDetailsSummaryList.getByText("First name");
    const lastNameRowTitle = clientDetailsSummaryList.getByText("Last name");
    const dobRowTitle = clientDetailsSummaryList.getByText("Date of birth");
    const homeAddressRowTitle = clientDetailsSummaryList.getByText("Home address");
    const correspondenceAddressRowTitle = clientDetailsSummaryList.getByText("Correspondence address");

    await expect(firstNameRowTitle).toBeVisible();
    await expect(lastNameRowTitle).toBeVisible();
    await expect(dobRowTitle).toBeVisible();
    await expect(homeAddressRowTitle).toBeVisible();
    await expect(correspondenceAddressRowTitle).toBeVisible();

    const continueButton = page.getByRole("button");
    await expect(continueButton).toHaveText("Continue");

  });

});
