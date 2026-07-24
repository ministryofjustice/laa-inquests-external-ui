import { test as base, expect, type BrowserContext } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "#tests/playwright/fixtures/pages/PageFactory.js";
import {
  AUTH_FILE,
  SESSION_COOKIE_NAME,
} from "#tests/playwright/constants/AuthFile.js";
import { TEST_CONFIG } from "../playwright.config.js";

type WorkerStorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
  freshSession: void;
}

interface WorkerFixtures {
  workerStorageState: WorkerStorageState;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Establishes a unique Express session per worker via a silent Azure AD SSO redirect.
  // Runs once per worker — prevents parallel workers sharing the same session ID from AUTH_FILE.
  workerStorageState: [
    async ({ browser }, use): Promise<void> => {
      const context = await browser.newContext({
        storageState: AUTH_FILE,
        baseURL: TEST_CONFIG.BASE_URL,
      });
      await context.clearCookies({ name: SESSION_COOKIE_NAME });
      const setupPage = await context.newPage();
      await setupPage.goto("/");
      await setupPage.waitForURL("/");
      const state = await context.storageState();
      await setupPage.close();
      await context.close();
      await use(state);
    },
    { scope: "worker", auto: true },
  ],

  // Each test gets its own page backed by the worker's unique session state.
  page: async ({ browser, workerStorageState }, use): Promise<void> => {
    const context = await browser.newContext({
      storageState: workerStorageState,
      baseURL: TEST_CONFIG.BASE_URL,
    });
    const testPage = await context.newPage();
    await use(testPage);
    await context.close();
  },

  // Reset per-test journey state while staying authenticated to prevent tests conflicting
  // Visiting "/" calls clearApplyFormData
  freshSession: [
    async ({ page }, use): Promise<void> => {
      await page.goto("/");

      await use();
    },
    { auto: true },
  ],

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
});

export { expect } from "@playwright/test";
