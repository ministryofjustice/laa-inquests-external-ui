import { test as setup } from "@playwright/test";
import * as OTPAuth from "otpauth";
import { AUTH_FILE } from "#tests/playwright/constants/AuthFile.js";

const MICROSOFT_NEXT_BUTTON_NAME = "Next";
const MICROSOFT_OTP_SELECTOR = "input#idTxtBx_SAOTCC_OTC";
const MICROSOFT_SUBMIT_SELECTOR = "input[type=submit]";
const MICROSOFT_STAY_SIGNED_IN_SELECTOR = "input[type=submit][value='Yes']";
const OTP_DIGITS = 6;
const OTP_PERIOD_SECONDS = 30;

setup("authenticate provider with MFA", async ({ page }) => {
  const {
    env: {
      E2E_PROVIDER_USERNAME: username,
      E2E_PROVIDER_PASSWORD: password,
      E2E_PROVIDER_MFA_TOTP_SECRET: totpSecret,
    },
  } = process;

  if (username === undefined || username === "") {
    throw new Error(
      "Missing required environment variable: E2E_PROVIDER_USERNAME",
    );
  }

  if (password === undefined || password === "") {
    throw new Error(
      "Missing required environment variable: E2E_PROVIDER_PASSWORD",
    );
  }

  if (totpSecret === undefined || totpSecret === "") {
    throw new Error(
      "Missing required environment variable: E2E_PROVIDER_MFA_TOTP_SECRET",
    );
  }

  await page.goto("/auth/login");

  await page.locator("input[type=email]").fill(username);
  await page.getByRole("button", { name: MICROSOFT_NEXT_BUTTON_NAME }).click();

  await page.locator("input[type=password]").fill(password);
  await page.locator(MICROSOFT_SUBMIT_SELECTOR).click();

  const totp = new OTPAuth.TOTP({
    issuer: "Microsoft",
    label: username,
    algorithm: "SHA1",
    digits: OTP_DIGITS,
    period: OTP_PERIOD_SECONDS,
    secret: totpSecret,
  });

  await page.locator(MICROSOFT_OTP_SELECTOR).fill(totp.generate());
  await page.locator(MICROSOFT_SUBMIT_SELECTOR).click();

  await page.locator(MICROSOFT_STAY_SIGNED_IN_SELECTOR).click();

  await page.waitForURL("/");
  await page.context().storageState({ path: AUTH_FILE });
});
