import { Locator, Page } from "playwright-core";

export async function getAndUpdateFormFields(
  page: Page,
  inputLookup: Record<string, string>,
  exactLabels: string[] = [],
): Promise<Record<string, Locator>> {
  const locatorLookup: Record<string, Locator> = {};
  for (let label in inputLookup) {
    if (exactLabels.includes(label)) {
      const input = page.getByLabel(label, { exact: true });
      locatorLookup[label] = input;
      await input.fill(inputLookup[label]);
    } else if (inputLookup[label] !== "") {
      const input = page.getByLabel(label);
      locatorLookup[label] = input;
      await input.fill(inputLookup[label]);
    } else {
      const input = page.getByLabel(label);
      locatorLookup[label] = input;
      await input.click();
    }
  }
  return locatorLookup;
}
