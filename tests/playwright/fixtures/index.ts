import { test as base, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "#tests/playwright/fixtures/pages/PageFactory.js";
import {
  APPLY_JOURNEY_SEQUENCE,
  CLAIM_JOURNEY_SEQUENCE,
  JOURNEYS,
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

  const path = journeyPath.split("?")[0];
  let journeyType: number | undefined;
  let stepIndex: number;

  const journey = Object.entries(JOURNEYS).find(([_, steps]) =>
    steps.includes(path),
  );

  if (journey) {
    journeyType = Number(journey[0]);
    stepIndex = journey[1].indexOf(path);
  } else {
    // Fallback: infer from URL path if not in JOURNEYS
    const applyStepIndex = APPLY_JOURNEY_SEQUENCE.indexOf(path);
    if (applyStepIndex >= 0) {
      journeyType = 1; // JOURNEY_TYPES.APPLY
      stepIndex = applyStepIndex;
    } else {
      const claimStepIndex = CLAIM_JOURNEY_SEQUENCE.indexOf(path);
      journeyType = 2; // JOURNEY_TYPES.CLAIM
      stepIndex = claimStepIndex;
    }
  }

  const lastCompletedIndex = stepIndex > 0 ? stepIndex - 1 : -1;

  const journeyParams =
    journeyType !== undefined
      ? `journeyStep=${lastCompletedIndex}&journeyType=${journeyType}`
      : "";

  await page.request.get(
    `/auth/test-login?${journeyParams}${queryParams ? `&${queryParams}` : ""}`,
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
  const path = getAbstractedPage(pageUrl);
  let journeyType: string | undefined;
  let stepIndex: number;

  const journey = Object.entries(JOURNEYS).find(([_, steps]) =>
    steps.includes(path),
  );
  journeyType = journey ? journey[0] : undefined;
  stepIndex = journey ? journey[1].indexOf(path) : 0;

  const lastCompletedIndex = stepIndex > 0 ? stepIndex - 1 : -1;
  await page.request.get(
    `/auth/test-login?journeyStep=${lastCompletedIndex}&journeyType=${journeyType}`,
    { maxRedirects: 0 },
  );
};

function getAbstractedPage(pageToMark: string): string {
  const noQueryUrl = pageToMark.split("?").at(0) ?? pageToMark;
  const abstractedApplicationPage = noQueryUrl.replace(
    /INQ-[A-Z0-9]{3}-[A-Z0-9]{3}/v,
    "INQ-[A-Z0-9]{3}-[A-Z0-9]{3}",
  );
  return abstractedApplicationPage.replace(
    /INQC-[A-Z0-9]{4}-[A-Z0-9]{4}/v,
    "INQC-[A-Z0-9]{4}-[A-Z0-9]{4}",
  );
}

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
