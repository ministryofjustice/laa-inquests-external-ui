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
      `they've read the <a class="govuk-link" href="#">LAA privacy policy</a>`,
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
    await page.goto(currentPage);
    const form = await page.getByTestId("client-declaration-form");
    await continueToNextPage(form, page);
    await expect(page.url()).toContain(nextPage);
  });
});
