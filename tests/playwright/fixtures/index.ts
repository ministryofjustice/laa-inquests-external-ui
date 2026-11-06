import { test as base, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "#tests/playwright/fixtures/pages/PageFactory.js";
import { APPLY_JOURNEY_SEQUENCE } from "#src/infrastructure/config/journeySequences.js";

interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
  freshSession: void;
  authorizeApplyStep: (pageUrl: string) => Promise<void>;
}

const authorizedPages = new WeakMap<Page, boolean>();

const authorizeTestForApplyStep = async (
  page: Page,
  pageUrl: string,
): Promise<void> => {
  const stepIndex = APPLY_JOURNEY_SEQUENCE.indexOf(pageUrl);
  if (stepIndex >= 0) {
    const lastCompletedIndex = stepIndex > 0 ? stepIndex - 1 : -1;
    await page.request.get(`/auth/test-login?applyStep=${lastCompletedIndex}`, {
      maxRedirects: 0,
    });
  }
};

export const test = base.extend<TestFixtures>({
  freshSession: [
    async ({ page, context }, use): Promise<void> => {
      const cookies = await context.cookies();
      if (cookies.length > 0) {
        await context.clearCookies();
      }
      await page.goto("/auth/test-login?applyStep=0");

      const originalGoto = page.goto.bind(page);
      page.goto = async (url: string | URL, options?: any) => {
        const urlString = url.toString();
        if (!authorizedPages.has(page)) {
          await authorizeTestForApplyStep(page, urlString);
          authorizedPages.set(page, true);
        }
        return originalGoto(urlString, options);
      };

      await use();
    },
    { auto: true },
  ],

  authorizeApplyStep: async ({ page }, use): Promise<void> => {
    authorizedPages.set(page, true);
    await use((pageUrl: string) => authorizeTestForApplyStep(page, pageUrl));
  },

  checkAccessibility: async ({ page }, use): Promise<void> => {
    const checkAccessibility = async (): Promise<void> => {
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
