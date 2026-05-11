import { test, expect } from "../../fixtures/index.js";

test.describe.only("Apply - check your answers", () => {
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

    

    const pageInsetText = page.getByText("You cannot change the answers on this page once you  continue");
    await expect(pageInsetText).toBeVisible();

     const continueButton = page.getByRole("button");
    await expect(continueButton).toHaveText("Continue");
  });

  test("renders client details summary list", async ({ page }) => {

    page.goto("/apply/check-your-answers");

    const caseDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "Case details",
    });

    await expect(caseDetailsHeading).toBeVisible();

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

   

  });
  test("renders deceased details summary list", async ({ page }) => {

    page.goto("/apply/check-your-answers");

    const inquestHeading = await page.getByRole("heading", {
      level: 2,
      name: "Inquest",
    });

    await expect(inquestHeading).toBeVisible();

    const deceasedDetailsSummaryList = page.getByTestId("deceased-details-summary-list");
    await expect(deceasedDetailsSummaryList).toBeVisible();

    const deceasedDetailsTableHeading = await deceasedDetailsSummaryList.getByRole("heading", {
      level: 2,
      name: "Deceased details",
    });
    await expect(deceasedDetailsTableHeading).toBeVisible();

    const deceasedDetailsChangeLink = deceasedDetailsSummaryList.getByRole("link");
    await expect(deceasedDetailsChangeLink).toBeVisible();

    await expect(deceasedDetailsChangeLink).toHaveAttribute(
      "href",
      "/apply/deceased-details/name",
    );

    const firstNameRowTitle = deceasedDetailsSummaryList.getByText("First name");
    const lastNameRowTitle = deceasedDetailsSummaryList.getByText("Last name");
    const dodTitle = deceasedDetailsSummaryList.getByText("Date of death");
    const clientRelationshipTitle = deceasedDetailsSummaryList.getByText("Client relationship");
    const inquestIdTitle = deceasedDetailsSummaryList.getByText("Inquest ID");

    await expect(firstNameRowTitle).toBeVisible();
    await expect(lastNameRowTitle).toBeVisible();
    await expect(dodTitle).toBeVisible();
    await expect(clientRelationshipTitle).toBeVisible();
    await expect(inquestIdTitle).toBeVisible();

   

  });
  test("renders interested parties  summary list", async ({ page }) => {

    page.goto("/apply/check-your-answers");

    
    const interestedPartiesSummaryList = page.getByTestId("interested-parties-summary-list");
    await expect(interestedPartiesSummaryList).toBeVisible();

    const interestedPartiesTableHeading = await interestedPartiesSummaryList.getByRole("heading", {
      level: 2,
      name: "Interested parties",
    });
    await expect(interestedPartiesTableHeading).toBeVisible();

    const interestedPartiesChangeLink = interestedPartiesSummaryList.getByRole("link");
    await expect(interestedPartiesChangeLink).toBeVisible();

    await expect(interestedPartiesChangeLink).toHaveAttribute(
      "href",
      "/apply/public-authority",
    );

    const publicAuthorityRowTitle = interestedPartiesSummaryList.getByText("Public authority");
    
    await expect(publicAuthorityRowTitle).toBeVisible();

  });

  test("renders coroner's letter summary list", async ({ page }) => {

    page.goto("/apply/check-your-answers");

    
    const coronersLetterSummaryList = page.getByTestId("coroners-letter-summary-list");
    await expect(coronersLetterSummaryList).toBeVisible();

    const coronersLetterTableHeading = await coronersLetterSummaryList.getByRole("heading", {
      level: 2,
      name: "Coroner's letter",
    });
    await expect(coronersLetterTableHeading).toBeVisible();

    const coronersLetterChangeLink = coronersLetterSummaryList.getByRole("link");
    await expect(coronersLetterChangeLink).toBeVisible();

    await expect(coronersLetterChangeLink).toHaveAttribute(
      "href",
      "/apply/upload",
    );

    const fileNameRowTitle = coronersLetterSummaryList.getByText("File name");
    
    await expect(fileNameRowTitle).toBeVisible();

  });

});
