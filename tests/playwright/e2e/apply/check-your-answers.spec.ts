import { test, expect } from "../../fixtures/index.js";

test.describe("Apply - check your answers", () => {
  test("renders linked case details summary list when details are provided", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto("/apply/deceased-details/further-information");

    await page.getByLabel("Yes").click();
    await page
      .getByLabel(
        "Please provide any details available of linked or bridged inquests",
      )
      .fill("Linked case details provided");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.goto("/apply/check-your-answers");

    const linkedCaseDetailsSummary = page.getByTestId(
      "linked-case-details-summary-list",
    );
    await expect(linkedCaseDetailsSummary).toBeVisible();
    await expect(
      linkedCaseDetailsSummary.getByRole("heading", {
        level: 2,
        name: "Linked case details",
      }),
    ).toBeVisible();
    await expect(
      linkedCaseDetailsSummary.getByText("Details", { exact: true }),
    ).toBeVisible();
    await expect(
      linkedCaseDetailsSummary.getByText("Linked case details provided"),
    ).toBeVisible();
    await expect(linkedCaseDetailsSummary.getByRole("link")).toHaveAttribute(
      "href",
      "/apply/deceased-details/further-information?from=check-your-answers",
    );

    await checkAccessibility();
  });

  test("does not render linked case details summary list when no is selected", async ({
    page,
  }) => {
    await page.goto("/apply/deceased-details/further-information");

    await page.getByLabel("No").click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.goto("/apply/check-your-answers");

    await expect(
      page.getByTestId("linked-case-details-summary-list"),
    ).toHaveCount(0);
  });

  test("renders check your answers page header and back link", async ({
    page,
  }) => {
    await page.goto("/apply/check-your-answers");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const checkYourAnswersHeading = await page.getByRole("heading", {
      level: 1,
      name: "Check your answers",
    });

    await expect(checkYourAnswersHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute(
      "href",
      "/apply/upload-coroners-letter",
    );

    const pageInsetText = page.getByText(
      "You cannot change the answers on this page once you  continue",
    );
    await expect(pageInsetText).toBeVisible();

    const continueButton = page.getByRole("button");
    await expect(continueButton).toHaveText("Continue");

    await continueButton.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(
      "/apply/confirmation/client-declaration",
    );
  });

  test("renders client details summary list", async ({ page }) => {
    await page.goto("/apply/check-your-answers");

    const caseDetailsHeading = await page.getByRole("heading", {
      level: 2,
      name: "Case details",
    });

    await expect(caseDetailsHeading).toBeVisible();

    const clientDetailsSummaryList = page.getByTestId(
      "client-details-summary-list",
    );
    await expect(clientDetailsSummaryList).toBeVisible();

    const clientDetailsTableHeading = await clientDetailsSummaryList.getByRole(
      "heading",
      {
        level: 2,
        name: "Client details",
      },
    );
    await expect(clientDetailsTableHeading).toBeVisible();

    await expect(
      clientDetailsSummaryList.getByRole("link", {
        name: "Change first name",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/client-details/name-and-dob?from=check-your-answers",
    );
    await expect(
      clientDetailsSummaryList.getByRole("link", {
        name: "Change last name",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/client-details/name-and-dob?from=check-your-answers",
    );
    await expect(
      clientDetailsSummaryList.getByRole("link", {
        name: "Change date of birth",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/client-details/name-and-dob?from=check-your-answers",
    );
    await expect(
      clientDetailsSummaryList.getByRole("link", {
        name: "Change home address",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/client-details/home-address?from=check-your-answers",
    );
    await expect(
      clientDetailsSummaryList.getByRole("link", {
        name: "Change correspondence address",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/client-details/correspondence-address-source?from=check-your-answers",
    );
    await expect(
      clientDetailsSummaryList.getByRole("link", {
        name: "Change care of recipient",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/client-details/correspondence-recipient?from=check-your-answers",
    );

    const firstNameRowTitle = clientDetailsSummaryList.getByText("First name", {
      exact: true,
    });
    const lastNameRowTitle = clientDetailsSummaryList.getByText("Last name", {
      exact: true,
    });
    const dobRowTitle = clientDetailsSummaryList.getByText("Date of birth", {
      exact: true,
    });
    const homeAddressRowTitle = clientDetailsSummaryList.getByText(
      "Home address",
      {
        exact: true,
      },
    );
    const correspondenceAddressRowTitle = clientDetailsSummaryList.getByText(
      "Correspondence address",
      {
        exact: true,
      },
    );

    await expect(firstNameRowTitle).toBeVisible();
    await expect(lastNameRowTitle).toBeVisible();
    await expect(dobRowTitle).toBeVisible();
    await expect(homeAddressRowTitle).toBeVisible();
    await expect(correspondenceAddressRowTitle).toBeVisible();
  });
  test("renders deceased details summary list", async ({ page }) => {
    await page.goto("/apply/check-your-answers");

    const inquestHeading = await page.getByRole("heading", {
      level: 2,
      name: "Inquest",
    });

    await expect(inquestHeading).toBeVisible();

    const deceasedDetailsSummaryList = page.getByTestId(
      "deceased-details-summary-list",
    );
    await expect(deceasedDetailsSummaryList).toBeVisible();

    const deceasedDetailsTableHeading =
      await deceasedDetailsSummaryList.getByRole("heading", {
        level: 2,
        name: "Deceased details",
      });
    await expect(deceasedDetailsTableHeading).toBeVisible();

    await expect(
      deceasedDetailsSummaryList.getByRole("link", {
        name: "Change deceased first name",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/deceased-details/name?from=check-your-answers",
    );
    await expect(
      deceasedDetailsSummaryList.getByRole("link", {
        name: "Change deceased last name",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/deceased-details/name?from=check-your-answers",
    );
    await expect(
      deceasedDetailsSummaryList.getByRole("link", {
        name: "Change deceased date of birth",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/deceased-details/dob?from=check-your-answers",
    );
    await expect(
      deceasedDetailsSummaryList.getByRole("link", {
        name: "Change deceased date of death",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/deceased-details/dod?from=check-your-answers",
    );
    await expect(
      deceasedDetailsSummaryList.getByRole("link", {
        name: "Change client relationship",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/deceased-details/client-relationship?from=check-your-answers",
    );
    await expect(
      deceasedDetailsSummaryList.getByRole("link", {
        name: "Change coroner’s reference",
      }),
    ).toHaveAttribute(
      "href",
      "/apply/deceased-details/coroner-reference?from=check-your-answers",
    );

    const firstNameRowTitle = deceasedDetailsSummaryList.getByText(
      "First name",
      {
        exact: true,
      },
    );
    const lastNameRowTitle = deceasedDetailsSummaryList.getByText("Last name", {
      exact: true,
    });
    const dodTitle = deceasedDetailsSummaryList.getByText("Date of death", {
      exact: true,
    });
    const dobTitle = deceasedDetailsSummaryList.getByText("Date of birth", {
      exact: true,
    });
    const clientRelationshipTitle = deceasedDetailsSummaryList.getByText(
      "Client relationship",
      {
        exact: true,
      },
    );
    const inquestIdTitle = deceasedDetailsSummaryList.getByText(
      "Coroner’s reference",
      {
        exact: true,
      },
    );

    await expect(firstNameRowTitle).toBeVisible();
    await expect(lastNameRowTitle).toBeVisible();
    await expect(dobTitle).toBeVisible();
    await expect(dodTitle).toBeVisible();
    await expect(clientRelationshipTitle).toBeVisible();
    await expect(inquestIdTitle).toBeVisible();
  });
  test("renders proceedings summary list", async ({ page }) => {
    await page.goto("/apply/check-your-answers");

    const proceedingsSummaryList = page.getByTestId("proceedings-summary-list");
    await expect(proceedingsSummaryList).toBeVisible();

    const proceedingsTableHeading = await proceedingsSummaryList.getByRole(
      "heading",
      {
        level: 2,
        name: "Proceedings",
      },
    );
    await expect(proceedingsTableHeading).toBeVisible();

    await expect(proceedingsSummaryList.getByRole("link")).toHaveCount(0);
  });

  test("renders interested parties summary list", async ({ page }) => {
    await page.goto("/apply/check-your-answers");

    const interestedPartiesSummaryList = page.getByTestId(
      "interested-parties-summary-list",
    );
    await expect(interestedPartiesSummaryList).toBeVisible();

    const interestedPartiesTableHeading =
      await interestedPartiesSummaryList.getByRole("heading", {
        level: 2,
        name: "Interested parties",
      });
    await expect(interestedPartiesTableHeading).toBeVisible();

    await expect(interestedPartiesSummaryList.getByRole("link")).toHaveCount(0);
  });

  test("renders coroner's letter summary list", async ({ page }) => {
    await page.goto("/apply/check-your-answers");

    const coronersLetterSummaryList = page.getByTestId(
      "coroners-letter-summary-list",
    );
    await expect(coronersLetterSummaryList).toBeVisible();

    const coronersLetterTableHeading =
      await coronersLetterSummaryList.getByRole("heading", {
        level: 2,
        name: "Coroner's letter",
      });
    await expect(coronersLetterTableHeading).toBeVisible();

    const coronersLetterChangeLink =
      coronersLetterSummaryList.getByRole("link");
    await expect(coronersLetterChangeLink).toBeVisible();

    await expect(coronersLetterChangeLink).toHaveAttribute(
      "href",
      "/apply/upload-coroners-letter?from=check-your-answers",
    );

    const fileNameRowTitle = coronersLetterSummaryList.getByText("File name");

    await expect(fileNameRowTitle).toBeVisible();
  });
});
