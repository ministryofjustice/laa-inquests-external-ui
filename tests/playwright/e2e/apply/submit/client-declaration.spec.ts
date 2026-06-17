import { test, expect } from "#tests/playwright/fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";
import {
  continueToNextPage,
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "../../../utils/govuk-validators.js";

const previousPage = "/apply/check-your-answers";
const currentPage = "/apply/confirmation/client-declaration";
const nextPage = "/apply/confirmation/success";

const headerText = "Confirm the following";

test.describe("Provider can", () => {
  test("view the client declaration page", async ({ page }) => {
    await page.goto("/apply/client-details/name-and-dob");
    const nameForm = page.getByTestId("client-details-form");

    const [firstName, surname] = ["Test", "User"];
    await getAndUpdateFormFields(
      page,
      {
        "First name": firstName,
        "Last name": surname,
        Day: "1",
        Month: "1",
        Year: "2000",
        No: "",
      },
      ["Last name"],
    );
    await continueToNextPage(nameForm, page);

    await page.goto(currentPage);
    const form = await page.getByTestId("client-declaration-form");

    await validateHeader(page, headerText, 2);
    await validateBackButton(page, previousPage);
    await validateFormAttributes(form, currentPage);
    await validateCSRFToken(form);
    await validateContinueButton(form);

    const listHeader = await form.getByRole("paragraph");
    await expect(listHeader).toBeVisible();
    await expect(listHeader).toHaveText(`${firstName} ${surname} agrees that:`);

    const listItems = await form.getByRole("listitem").all();
    await expect(listItems[0]).toHaveText(
      "they've instructed Test Provider to represent them",
    );
    const listItemOneHtml = await listItems[1].innerHTML();
    await expect(listItemOneHtml).toContain(
      `they've read the <a class="govuk-link" href="https://www.gov.uk/guidance/legal-aid-agency-privacy-notice" target="_blank">LAA privacy policy</a>`,
    );
    await expect(listItems[2]).toHaveText(
      "we can share their information with other government departments like DWP and HMRC",
    );
    await expect(listItems[3]).toHaveText(
      "the information they've given is complete and correct",
    );

    const warning = form.getByText(
      "If they give wrong or incomplete information or do not report changes they may:",
    );
    await expect(warning).toBeVisible();
    const warningListItems = await warning.getByRole("listitem").all();
    await expect(warningListItems[0]).toHaveText("be prosecuted");
    await expect(warningListItems[1]).toHaveText(
      "need to pay a financial penalty",
    );
    await expect(warningListItems[2]).toHaveText(
      "have their legal aid stopped and have to pay back the costs",
    );

    const checkBox = await form.getByRole("checkbox", {
      name: "I confirm the above is correct and that I'll get a signed declaration from my client",
    });
    await expect(checkBox).toBeVisible();
  });

  test("clicking continue redirects to confirmation success", async ({
    page,
  }) => {
    const continueNextPage = async (formTestId: string): Promise<void> => {
      const form = await page.getByTestId(formTestId);
      await continueToNextPage(form, page);
    };

    await page.goto("/apply/client-details/name-and-dob");
    await getAndUpdateFormFields(
      page,
      {
        "First name": "test",
        "Last name": "surname",
        Day: "01",
        Month: "01",
        Year: "1990",
        Yes: "",
        "What was your client's last name at birth?": "Last name at birth",
      },
      ["Last name"],
    );
    await continueNextPage("client-details-form");
    await expect(page.url()).toContain("/apply/client-details/nino");

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Enter your client's National Insurance number": "PC123456C",
    });
    await continueNextPage("nino-form");
    await expect(page.url()).toContain(
      "/apply/client-details/has-prev-application",
    );

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueNextPage("has-prev-application-form");

    await expect(page.url()).toContain("/apply/client-details/home-address");
    await getAndUpdateFormFields(page, {
      "Address line 1": "1 Street",
      "Town or city": "My town",
      Postcode: "SW122AA",
    });
    await continueNextPage("home-address-form");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );
    await getAndUpdateFormFields(page, { "My client's UK home address": "" });
    await continueNextPage("correspondence-address-source-form");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );
    await getAndUpdateFormFields(page, { No: "" });
    await continueNextPage("correspondence-recipient-form");

    await expect(page.url()).toContain("/apply/proceedings");
    await page.getByLabel("CAPA", { exact: true }).click();
    await continueNextPage("add-proceeding-form");

    await expect(page.url()).toContain("/apply/proceedings/confirmation");
    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueNextPage("add-another-proceeding-form");
    await expect(page.url()).toContain("/apply/deceased-details/name");

    await getAndUpdateFormFields(
      page,
      {
        "First name": "bob",
        "Last name": "boberton",
      },
      ["Last name"],
    );
    await continueNextPage("deceased-details-form");
    await expect(page.url()).toContain("/apply/deceased-details/dod");

    await getAndUpdateFormFields(page, {
      Day: "01",
      Month: "01",
      Year: "2025",
    });
    await continueNextPage("deceased-date-of-death-form");
    await expect(page.url()).toContain("/apply/deceased-details/dob");

    await getAndUpdateFormFields(page, {
      Day: "01",
      Month: "01",
      Year: "2000",
    });
    await continueNextPage("deceased-date-of-birth-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/client-relationship",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Please describe the nature of the relationship between your client and the deceased":
        "guardian",
    });
    await continueNextPage("deceased-client-relationship-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/coroner-reference",
    );

    await getAndUpdateFormFields(page, {
      "Please enter your reference number": "123356789",
    });
    await continueNextPage("deceased-coroner-reference-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Please provide any details available of linked or bridged inquests":
        "further details here",
    });
    await continueNextPage("deceased-further-information-form");
    await expect(page.url()).toContain("/apply/public-authority");

    await page.getByLabel("Department for Transport", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("/apply/public-authority/confirmation");

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueNextPage("add-another-public-authority-form");
    await expect(page.url()).toContain("/apply/check-your-answers");

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(currentPage);

    const form = await page.getByTestId("client-declaration-form");
    await expect(form.getByText(`test surname agrees that:`)).toBeVisible();
    await form
      .getByRole("checkbox", {
        name: "I confirm the above is correct and that I'll get a signed declaration from my client",
      })
      .check();
    await continueToNextPage(form, page);
    await expect(page.url()).toContain(nextPage);
  });

  test("sees validation error when declaration is not confirmed", async ({
    page,
  }) => {
    const continueNextPage = async (formTestId: string): Promise<void> => {
      const form = await page.getByTestId(formTestId);
      await continueToNextPage(form, page);
    };

    await page.goto("/apply/client-details/name-and-dob");
    await getAndUpdateFormFields(
      page,
      {
        "First name": "test",
        "Last name": "surname",
        Day: "01",
        Month: "01",
        Year: "1990",
        Yes: "",
        "What was your client's last name at birth?": "Last name at birth",
      },
      ["Last name"],
    );
    await continueNextPage("client-details-form");
    await expect(page.url()).toContain("/apply/client-details/nino");

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Enter your client's National Insurance number": "PC123456C",
    });
    await continueNextPage("nino-form");
    await expect(page.url()).toContain(
      "/apply/client-details/has-prev-application",
    );

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueNextPage("has-prev-application-form");

    await expect(page.url()).toContain("/apply/client-details/home-address");
    await getAndUpdateFormFields(page, {
      "Address line 1": "1 Street",
      "Town or city": "My town",
      Postcode: "SW122AA",
    });
    await continueNextPage("home-address-form");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-address-source",
    );
    await getAndUpdateFormFields(page, { "My client's UK home address": "" });
    await continueNextPage("correspondence-address-source-form");

    await expect(page.url()).toContain(
      "/apply/client-details/correspondence-recipient",
    );
    await getAndUpdateFormFields(page, { No: "" });
    await continueNextPage("correspondence-recipient-form");

    await expect(page.url()).toContain("/apply/proceedings");
    await page.getByLabel("CAPA", { exact: true }).click();
    await continueNextPage("add-proceeding-form");

    await expect(page.url()).toContain("/apply/proceedings/confirmation");
    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueNextPage("add-another-proceeding-form");
    await expect(page.url()).toContain("/apply/deceased-details/name");

    await getAndUpdateFormFields(
      page,
      {
        "First name": "bob",
        "Last name": "boberton",
      },
      ["Last name"],
    );
    await continueNextPage("deceased-details-form");
    await expect(page.url()).toContain("/apply/deceased-details/dod");

    await getAndUpdateFormFields(page, {
      Day: "01",
      Month: "01",
      Year: "2025",
    });
    await continueNextPage("deceased-date-of-death-form");
    await expect(page.url()).toContain("/apply/deceased-details/dob");

    await getAndUpdateFormFields(page, {
      Day: "01",
      Month: "01",
      Year: "2000",
    });
    await continueNextPage("deceased-date-of-birth-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/client-relationship",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Please describe the nature of the relationship between your client and the deceased":
        "guardian",
    });
    await continueNextPage("deceased-client-relationship-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/coroner-reference",
    );

    await getAndUpdateFormFields(page, {
      "Please enter your reference number": "123356789",
    });
    await continueNextPage("deceased-coroner-reference-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Please provide any details available of linked or bridged inquests":
        "further details here",
    });
    await continueNextPage("deceased-further-information-form");
    await expect(page.url()).toContain("/apply/public-authority");

    await page.getByLabel("Department for Transport", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("/apply/public-authority/confirmation");

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueNextPage("add-another-public-authority-form");
    await expect(page.url()).toContain("/apply/upload-coroners-letter");

    await continueNextPage("upload-coroners-letter-form");
    await expect(page.url()).toContain("/apply/check-your-answers");

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(currentPage);

    const form = await page.getByTestId("client-declaration-form");
    await expect(form.getByText("test surname agrees that:")).toBeVisible();

    await continueToNextPage(form, page);

    await expect(page.url()).toContain(currentPage);
    const errorSummary = page.locator(".govuk-error-summary");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      "You need to confirm the declaration to submit this application",
    );
  });
});
