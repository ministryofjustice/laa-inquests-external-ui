import { expect, test as setup } from "@playwright/test";

const SEED_APPLICATION_PATH = "/test/seed/application";
const HTTP_CREATED = 201;

setup("seed a minimum application for claims journey", async ({ page }) => {
  const response = await page.request.get(SEED_APPLICATION_PATH);
  const responseText = await response.text();

  if (response.status() !== HTTP_CREATED) {
    console.log(
      `Seed endpoint failed with status ${String(response.status())}: ${responseText}`,
    );
  }

  expect(response.status()).toBe(HTTP_CREATED);

  const responseBody = JSON.parse(responseText) as { laaReference?: number };
  expect(typeof responseBody.laaReference).toBe("number");
});
