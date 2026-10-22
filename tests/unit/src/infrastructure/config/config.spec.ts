import { expect } from "chai";
import { strict as assert } from "assert";
import type { Config } from "#src/infrastructure/config/config.types.js";

const REQUIRED_ENV = {
  SESSION_SECRET: "secret",
  SESSION_LOG_HASH_SECRET: "session-log-hash-secret",
  SESSION_NAME: "sessionId",
  USE_REDIS: "false",
  AUTH_DIRECTORY_URL: "https://login.example.com/tenant",
  AUTH_CLIENT_ID: "client-id",
  AUTH_CLIENT_SECRET: "client-secret",
  AUTH_REDIRECT_URI: "http://localhost/auth/callback",
  AUTH_POST_LOGOUT_URI: "http://localhost",
};

let importCounter = 0;

const importConfig = async (
  env: Record<string, string | undefined>,
): Promise<unknown> => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, REQUIRED_ENV);
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    // The query string forces a fresh evaluation of the module on every call.
    importCounter += 1;
    return await import(
      `../../../../../src/infrastructure/config/config.ts?case=${importCounter}`
    );
  } finally {
    process.env = originalEnv;
  }
};

describe("config SESSION_LOG_HASH_SECRET", () => {
  it("rejects an empty hash secret outside tests", async () => {
    await assert.rejects(
      importConfig({
        NODE_ENV: "production",
        SESSION_LOG_HASH_SECRET: "",
        SENTRY_DSN: "https://key@o0.ingest.sentry.io/1",
      }),
      {
        message:
          "SESSION_LOG_HASH_SECRET must be defined in environment variables.",
      },
    );
  });

  it("uses an empty hash secret in tests when the environment variable is missing", async () => {
    const module = (await importConfig({
      NODE_ENV: "test",
      SESSION_LOG_HASH_SECRET: undefined,
    })) as { default: Config };

    assert.equal(module.default.SESSION_LOG_HASH_SECRET, "");
  });

  it("requires the hash secret outside tests even when development auth is bypassed", async () => {
    await assert.rejects(
      importConfig({
        NODE_ENV: "development",
        DEV_SKIP_AUTH: "true",
        SESSION_LOG_HASH_SECRET: undefined,
      }),
      {
        message:
          "SESSION_LOG_HASH_SECRET must be defined in environment variables.",
      },
    );
  });
});

describe("config SENTRY_DSN", () => {
  it("throws in production when SENTRY_DSN is missing", async () => {
    let error: Error | undefined;
    try {
      await importConfig({ NODE_ENV: "production", SENTRY_DSN: undefined });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.equal(
      "SENTRY_DSN must be defined in environment variables.",
    );
  });

  it("throws in production when SENTRY_DSN is empty", async () => {
    let error: Error | undefined;
    try {
      await importConfig({ NODE_ENV: "production", SENTRY_DSN: "" });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.equal(
      "SENTRY_DSN must be defined in environment variables.",
    );
  });

  it("loads in production when SENTRY_DSN is set", async () => {
    const module = (await importConfig({
      NODE_ENV: "production",
      SENTRY_DSN: "https://key@o0.ingest.sentry.io/1",
    })) as { default: { SENTRY_DSN: string } };

    expect(module.default.SENTRY_DSN).to.equal(
      "https://key@o0.ingest.sentry.io/1",
    );
  });

  it("does not require SENTRY_DSN in development", async () => {
    const module = (await importConfig({
      NODE_ENV: "development",
      SENTRY_DSN: undefined,
    })) as { default: { SENTRY_DSN: string } };

    expect(module.default.SENTRY_DSN).to.equal("");
  });

  it("does not require SENTRY_DSN in test", async () => {
    const module = (await importConfig({
      NODE_ENV: "test",
      SENTRY_DSN: undefined,
    })) as { default: { SENTRY_DSN: string } };

    expect(module.default.SENTRY_DSN).to.equal("");
  });
});
