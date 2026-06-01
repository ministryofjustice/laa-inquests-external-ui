import { test as base, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "#tests/playwright/fixtures/pages/PageFactory.js";

interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
  seedAuthSession: void;
}

export const test = base.extend<TestFixtures>({
  checkAccessibility: async ({ page }, use): Promise<void> => {
    // Checks current page
    const checkAccessibility = async (): Promise<void> => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag22a"])
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

  seedAuthSession: [
    async ({ page }, use): Promise<void> => {
      await page.request.get("/test/auth-session");
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
