import { test as base, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "#tests/playwright/fixtures/pages/PageFactory.js";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
} from "#src/infrastructure/config/journeySequences.js";

interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
  freshSession: void;
  authorizeStep: (pageUrl: string) => Promise<void>;
}

const authorizedPages = new WeakMap<Page, boolean>();

export async function loginAtStepWithParams(
  page: Page,
  journeyPath: string,
  queryParams?: string,
) {
  // Start from a clean cookie jar so this spec gets its own session. The 401
  // case destroys the session, and reusing the shared seeded session would
  // wipe it for other specs.
  await page.context().clearCookies();

  const applyIndex = APPLY_JOURNEY_SEQUENCE.indexOf(journeyPath) - 1;

  const applyStepQueryParam = journeyPath ? `applyStep=${applyIndex}` : "";

  await page.request.get(
    `/auth/test-login?${applyStepQueryParam}&${queryParams}`,
    {
      maxRedirects: 0,
    },
  );
  authorizedPages.set(page, true);
}

const authorizeTestForJourneyStep = async (
  page: Page,
  pageUrl: string,
): Promise<void> => {
  const path = pageUrl.split("?")[0];
  let journeyType: "apply" | "claim";
  let stepIndex: number;

  const applyStepIndex = APPLY_JOURNEY_SEQUENCE.indexOf(path);
  if (applyStepIndex >= 0) {
    journeyType = "apply";
    stepIndex = applyStepIndex;
  } else {
    const claimStepIndex = CLAIM_JOURNEY_SEQUENCE.indexOf(path);
    journeyType = "claim";
    stepIndex = claimStepIndex;
  }

  const lastCompletedIndex = stepIndex > 0 ? stepIndex - 1 : -1;
  await page.request.get(
    `/auth/test-login?${journeyType}Step=${lastCompletedIndex}`,
    { maxRedirects: 0 },
  );
};

export const test = base.extend<TestFixtures>({
  freshSession: [
    async ({ page, context }, use): Promise<void> => {
      const cookies = await context.cookies();
      if (cookies.length > 0) {
        await context.clearCookies();
      }

      const originalGoto = page.goto.bind(page);
      page.goto = async (url: string | URL, options?: any) => {
        const urlString = url.toString();
        if (!authorizedPages.has(page)) {
          await authorizeTestForJourneyStep(page, urlString);
          authorizedPages.set(page, true);
        }
        return originalGoto(urlString, options);
      };

      await use();
    },
    { auto: true },
  ],

  // Called manually if jumps to un-authed page in middle of E2E test
  authorizeStep: async ({ page }, use): Promise<void> => {
    await use(async (pageUrl: string): Promise<void> => {
      authorizedPages.set(page, true);
      await authorizeTestForJourneyStep(page, pageUrl);
    });
  },

  checkAccessibility: async ({ page }, use): Promise<void> => {
    const checkAccessibility = async (): Promise<void> => {
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ])
        .disableRules(["aria-allowed-attr"]) // https://mojdt.slack.com/archives/C0125N0T3J7/p1667492016233769
        .analyze();

      const { violations } = accessibilityScanResults;
      expect(violations).toEqual([]);
    };
    await use(checkAccessibility);
  },

  pages: async ({ page }, use): Promise<void> => {
    const pageFactory = new PageFactory(page);
    await use(pageFactory);
  },
});

export { expect } from "@playwright/test";
