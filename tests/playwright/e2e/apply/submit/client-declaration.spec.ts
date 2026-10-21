import { test, expect } from "#tests/playwright/fixtures/index.js";
import { getAndUpdateFormFields } from "#tests/playwright/fixtures/pages/Apply.js";
import {
  continueToNextPage,
  validateBackButton,
  validateCSRFToken,
  validateFormAttributes,
  validateHeader,
} from "../../../utils/govuk-validators.js";

const previousPage = "/apply/check-your-answers";
const currentPage = "/apply/confirmation/client-declaration";
const nextPage = "/apply/confirmation/success";

const headerText = "Confirm the following";

test.describe("Provider can", () => {
  test("view the client declaration page", async ({
    page,
    checkAccessibility,
  }) => {
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

    await validateHeader(page, headerText, 1);
    await validateBackButton(page, previousPage);
    await validateFormAttributes(form, currentPage);
    await validateCSRFToken(form);

    await expect(
      form.getByText(
        "You must obtain a signed declaration from your client which confirms that:",
      ),
    ).toBeVisible();

    const lists = await form.getByRole("list").all();
    await expect(lists[0].getByRole("listitem")).toHaveText([
      `they, ${firstName} ${surname}, have instructed you, Test Firm, to represent them`,
      "they have read and agree to the Legal Aid Agency privacy policy",
      "the information they have given is complete and correct",
    ]);

    const warnings = await form.locator(".govuk-warning-text").all();
    await expect(warnings).toHaveLength(2);
    await expect(warnings[0]).toContainText(
      "You must also explain to your client that if information they have given is wrong or incomplete, or they don't tell us about any changes, they may:",
    );
    await expect(lists[1].getByRole("listitem")).toHaveText([
      "be prosecuted",
      "have to pay a financial penalty",
      "have their legal aid stopped and have to pay back any costs",
    ]);
    await expect(
      form.getByText(
        "A copy of this declaration will be included in your confirmation email. You can print this for your client to sign.",
      ),
    ).toBeVisible();
    await expect(
      form.getByText("On behalf of Test Firm, you must confirm that:"),
    ).toBeVisible();
    await expect(lists[2].getByRole("listitem")).toHaveText([
      "the information you have provided in this application is complete and correct",
      "you are authorised by Test Firm to submit legal aid applications against this contract",
      "you will obtain a signed copy of this declaration from your client, keep a copy on file, and provide it to the legal aid agency on request",
    ]);
    await expect(warnings[1]).toContainText(
      "Making a false declaration may lead to further action, including:",
    );
    await expect(lists[3].getByRole("listitem")).toHaveText([
      "prosecution",
      "nullification of certificates",
      "contract sanctions against your firm",
    ]);

    const checkBox = await form.getByRole("checkbox", {
      name: "I confirm that I have read and agree to the declaration",
    });
    await expect(checkBox).toBeVisible();
    await expect(form.getByRole("button", { name: "Submit" })).toBeVisible();
    await checkAccessibility();
  });

  test("submitting the declaration redirects to confirmation success", async ({
    page,
  }) => {
    const continueNextPage = async (formTestId: string): Promise<void> => {
      const form = await page.getByTestId(formTestId);
      await continueToNextPage(form, page);
    };

    const uploadDummyCoronersLetter = async (): Promise<void> => {
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/apply/upload-coroners-letter/upload") &&
            response.request().method() === "POST" &&
            response.status() === 201,
        ),
        page.setInputFiles("#documents", {
          name: "dummy-coroners-letter.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("dummy coroners letter content"),
        }),
      ]);
    };

    await page.goto("/apply/office-accounts");
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("**/apply/client-details/name-and-dob");

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

    const previousApplicationForm = page.getByTestId(
      "has-prev-application-form",
    );
    await previousApplicationForm
      .getByRole("radio", { name: "No", exact: true })
      .check();
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

    await expect(page.url()).toContain("/apply/proceeding");
    await page
      .getByLabel("IQMH - Death in mental health detention", { exact: true })
      .click();
    await continueNextPage("add-proceeding-form");

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
      "Yes, my client is a family member": "",
      "My client is the deceased's:": "guardian",
    });
    await continueNextPage("deceased-client-relationship-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/coroner-reference",
    );

    await getAndUpdateFormFields(page, {
      "Do you have a reference number from the coroner? (optional)":
        "123356789",
    });
    await continueNextPage("deceased-coroner-reference-form");
    await expect(page.url()).toContain(
      "/apply/deceased-details/further-information",
    );

    await getAndUpdateFormFields(page, {
      Yes: "",
      "Enter details of any linked or bridged inquests you are aware of (optional)":
        "further details here",
    });
    await continueNextPage("deceased-further-information-form");
    await expect(page.url()).toContain("/apply/public-authority");

    await page.getByLabel("Department for Transport", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain("/apply/upload-coroners-letter");

    await uploadDummyCoronersLetter();
    await continueNextPage("upload-coroners-letter-form");
    await expect(page.url()).toContain("/apply/check-your-answers");

    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(currentPage);

    const form = await page.getByTestId("client-declaration-form");
    await form
      .getByRole("checkbox", {
        name: "I confirm that I have read and agree to the declaration",
      })
      .check();
    await form.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(nextPage);
  });

  test("sees validation error when declaration is not confirmed", async ({
    page,
    checkAccessibility,
  }) => {
    await page.goto(currentPage);
    const form = await page.getByTestId("client-declaration-form");
    await form.getByRole("button", { name: "Submit" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.url()).toContain(currentPage);
    const errorSummary = page.locator(".govuk-error-summary");
    await expect(errorSummary).toBeVisible();
    await expect(errorSummary).toContainText("There is a problem");
    await expect(errorSummary).toContainText(
      "You need to confirm the declaration to submit this application",
    );
    await checkAccessibility();
  });
});
