import { test, expect } from "#tests/playwright/fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";
import {
  continueToNextPage,
  validateBackButton,
  validateContinueButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "../deceased-details/form-validation-utils.js";

const previousPage = "/apply/check-your-answers";
const currentPage = "/apply/submit/client-declaration";
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
    const continueTemp = async (formTestId: string): Promise<void> => {
      const form = await page.getByTestId(formTestId);
      await continueToNextPage(form, page);
    };

    // Use the provided data for all fields and steps
    await page.goto("/apply/client-details/name-and-dob");
    await getAndUpdateFormFields(
      page,
      {
        "First name": "test",
        "Last name": "surname",
        Day: "01",
        Month: "01",
        Year: "1990",
        No: "",
      },
      ["Last name"],
    );
    await continueTemp("client-details-form");
    await expect(page.url()).toContain("/apply/client-details/nino");

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Enter your client's National Insurance number": "AB12345A",
    });
    await continueTemp("nino-form");
    await expect(page.url()).toContain(
      "/apply/client-details/has-prev-application",
    );

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueTemp("has-prev-application-form");
    await expect(page.url()).toContain("/apply/proceedings");

    // Select the custom proceedingId TEST1 (simulate radio by label)
    await page.getByLabel("TEST1", { exact: true }).click();
    await continueTemp("add-proceeding-form");
    await expect(page.url()).toContain("/apply/proceedings/confirmation");

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueTemp("add-another-proceeding-form");
    await expect(page.url()).toContain("/apply/deceased-details/name");

    await getAndUpdateFormFields(
      page,
      {
        "First name": "bob",
        "Last name": "boberton",
      },
      ["Last name"],
    );
    await continueTemp("deceased-details-form");
    await expect(page.url()).toContain("/apply/deceased-details/dod");

    await getAndUpdateFormFields(page, {
      Day: "01",
      Month: "01",
      Year: "2025",
    });
    await continueTemp("deceased-date-of-death-form");
    await expect(page.url()).toContain("/apply/deceased-details/dob");

    await getAndUpdateFormFields(page, {
      Day: "01",
      Month: "01",
      Year: "2000",
    });
    await continueTemp("deceased-date-of-birth-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/client-relationship",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Please describe the nature of the relationship between your client and the deceased":
        "guardian",
    });
    await continueTemp("deceased-client-relationship-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/coroner-reference",
    );

    await getAndUpdateFormFields(page, {
      "Please enter your reference number": "beans",
    });
    await continueTemp("deceased-coroner-reference-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Please provide any details available of linked or bridged inquests":
        "he died",
    });
    await continueTemp("deceased-further-information-form");
    await expect(page.url()).toContain("/apply/public-authority");

    // Select the custom publicBodyId (simulate radio by label)
    await page.getByLabel("Department for Transport", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("/apply/public-authority/confirmation");

    await getAndUpdateFormFields(page, {
      No: "",
    });
    await continueTemp("add-another-public-authority-form");
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
});
