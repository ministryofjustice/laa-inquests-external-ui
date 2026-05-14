import { test, expect } from "../../fixtures/index.js";

test.describe.only("Apply - confirm success", () => {
  test("renders confirm success page header and back link", async ({
    page,
  }) => {
    page.goto("/apply/submit/success");

    const backButton = page.getByRole("link", { name: "Back", exact: true });
    const confirmSuccessHeading = await page.getByRole("heading", {
      level: 1,
      name: "Application complete",
    });
    const caseRefHeading = page.getByText("Your case reference number is");

    await expect(confirmSuccessHeading).toBeVisible();
    await expect(caseRefHeading).toBeVisible();

    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute("href", "/apply/submit/client-declaration");

  });

  test("renders confirm success page content", async ({
    page,
  }) => {
    page.goto("/apply/submit/success");

    const whatYouNeedToDoHeading = await page.getByRole("heading", {
      level: 2,
      name: "What you need to do",
    });
    const whatHappensNext = await page.getByRole("heading", {
      level: 2,
      name: "What happens next",
    });

    await expect(whatYouNeedToDoHeading).toBeVisible();
    await expect(whatYouNeedToDoHeading).toBeVisible();

    const emailConfirmMessage = page.getByText("We've sent you a confirmation email.");
    await expect(emailConfirmMessage).toBeVisible();

    const keepList = page.getByRole("list").filter({hasText: "a copy of the application"});
    const keepListItems = keepList.getByRole("listitem");
    
    await expect(keepList).toBeVisible();
    await expect(keepListItems).toHaveCount(2);
    await expect(keepListItems).toHaveText(["a copy of the application", "a signed copy of the declaration"]);

    const printMessage = page.getByText("Print the completed application and get your client to sign it.");
    const whatYouNeedTodoMessage = page.getByText("You may need to show these if you're audited by the LAA in the future.");

    await expect(printMessage).toBeVisible();
    await expect(whatYouNeedTodoMessage).toBeVisible();

    const whatHappensNextMessage = page.getByText("We'll check your application to see if your client is entitled to legal aid.");
    const whatHappensNextDecisionMessage = page.getByText("We'll let you know our decision.");

    await expect(whatHappensNextMessage).toBeVisible();
    await expect(whatHappensNextDecisionMessage).toBeVisible();


  });

});
